"""
LeadForge AI — Website Crawler
Visits websites using Playwright (headless Chromium) and extracts
publicly available contact information and metadata.
"""
import asyncio
import re
import logging
from typing import Optional, Dict, Any
from urllib.parse import urljoin, urlparse

from tenacity import retry, stop_after_attempt, wait_fixed

logger = logging.getLogger(__name__)


# Pages to crawl on each website
PAGES_TO_CRAWL = ["/", "/contact", "/contact-us", "/about", "/about-us", "/team", "/services"]

# Email regex (public facing)
EMAIL_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
)

# Phone regex (US + international)
PHONE_REGEX = re.compile(
    r"(?:\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}"
)

# Social media URL patterns
SOCIAL_PATTERNS = {
    "facebook": re.compile(r"(?:https?://)?(?:www\.)?facebook\.com/[^\s\"'<>]+"),
    "instagram": re.compile(r"(?:https?://)?(?:www\.)?instagram\.com/[^\s\"'<>]+"),
    "linkedin": re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/(?:company|in)/[^\s\"'<>]+"),
    "twitter": re.compile(r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/[^\s\"'<>]+"),
    "youtube": re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/(?:channel|user|c)/[^\s\"'<>]+"),
}

# Disposable / generic emails to exclude
EMAIL_BLACKLIST = {
    "example.com", "test.com", "domain.com", "email.com",
    "sentry.io", "sampleemail.com", "placeholder.com",
}


def _normalize_url(url: str, base: str) -> str:
    """Make relative URLs absolute."""
    if url.startswith("http"):
        return url
    return urljoin(base, url)


def _clean_email(email: str) -> Optional[str]:
    """Validate and clean extracted emails."""
    email = email.lower().strip()
    domain = email.split("@")[-1]
    if domain in EMAIL_BLACKLIST:
        return None
    if len(email) > 100:
        return None
    return email


def _clean_social(url: str) -> Optional[str]:
    """Normalize social media URLs."""
    url = url.strip().rstrip("/")
    if len(url) < 10 or len(url) > 300:
        return None
    return url


class CrawlResult:
    """Result from crawling a website."""

    def __init__(self, website: str):
        self.website = website
        self.success = False
        self.emails: list = []
        self.phones: list = []
        self.facebook_url: Optional[str] = None
        self.instagram_url: Optional[str] = None
        self.linkedin_url: Optional[str] = None
        self.twitter_url: Optional[str] = None
        self.youtube_url: Optional[str] = None
        self.page_title: Optional[str] = None
        self.meta_description: Optional[str] = None
        self.ssl_enabled: bool = False
        self.has_contact_form: bool = False
        self.has_cta_button: bool = False
        self.has_social_links: bool = False
        self.error: Optional[str] = None
        self.pages_crawled: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "website": self.website,
            "success": self.success,
            "emails": self.emails,
            "phones": self.phones,
            "facebook_url": self.facebook_url,
            "instagram_url": self.instagram_url,
            "linkedin_url": self.linkedin_url,
            "twitter_url": self.twitter_url,
            "youtube_url": self.youtube_url,
            "page_title": self.page_title,
            "meta_description": self.meta_description,
            "ssl_enabled": self.ssl_enabled,
            "has_contact_form": self.has_contact_form,
            "has_cta_button": self.has_cta_button,
            "has_social_links": self.has_social_links,
            "pages_crawled": self.pages_crawled,
        }


class WebsiteCrawler:
    """
    Headless browser crawler using Playwright.
    Visits public pages and extracts contact info.
    Only accesses publicly available information.
    """

    def __init__(self, delay: float = 2.0, timeout: int = 15000):
        self.delay = delay
        self.timeout = timeout  # milliseconds

    async def crawl(self, website: str) -> CrawlResult:
        """
        Crawl a website and extract all public contact information.

        Args:
            website: Full URL of the website to crawl

        Returns:
            CrawlResult with all extracted data
        """
        result = CrawlResult(website)

        # Determine SSL
        result.ssl_enabled = website.startswith("https://")

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-setuid-sandbox",
                    ]
                )
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (compatible; LeadForgeBot/1.0; +https://techarbor.com/bot)",
                    ignore_https_errors=True,
                    viewport={"width": 1280, "height": 800},
                )

                try:
                    base_url = website.rstrip("/")
                    all_text = []
                    all_html = []

                    for path in PAGES_TO_CRAWL:
                        url = f"{base_url}{path}" if path != "/" else base_url
                        try:
                            page = await context.new_page()
                            await page.goto(url, timeout=self.timeout, wait_until="domcontentloaded")
                            await asyncio.sleep(1)  # Let JS render

                            html = await page.content()
                            text = await page.inner_text("body")
                            all_text.append(text)
                            all_html.append(html)
                            result.pages_crawled += 1

                            # Extract title and meta from homepage
                            if path == "/":
                                try:
                                    result.page_title = await page.title()
                                except Exception:
                                    pass
                                try:
                                    meta = await page.get_attribute(
                                        'meta[name="description"]', "content"
                                    )
                                    result.meta_description = meta
                                except Exception:
                                    pass

                            await page.close()
                        except Exception:
                            try:
                                await page.close()
                            except Exception:
                                pass
                            continue  # Skip pages that fail

                        await asyncio.sleep(self.delay)

                    # Extract contact info from all collected content
                    full_text = " ".join(all_text)
                    full_html = " ".join(all_html)

                    # Emails
                    raw_emails = EMAIL_REGEX.findall(full_text) + EMAIL_REGEX.findall(full_html)
                    
                    # Explicitly check mailto links
                    mailto_matches = re.findall(r'href=[\'"]mailto:([^\'"]+)[\'"]', full_html, re.IGNORECASE)
                    for match in mailto_matches:
                        clean_match = match.split('?')[0].strip()
                        if clean_match:
                            raw_emails.append(clean_match)
                            
                    # Find obfuscated emails (e.g. info [at] domain [dot] com)
                    obfuscated_matches = re.findall(r'\b([A-Za-z0-9._%+\-]+)\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([A-Za-z0-9.\-]+)\s*(?:\[dot\]|\(dot\)|\s+dot\s+)\s*([A-Za-z]{2,})\b', full_text, re.IGNORECASE)
                    for m in obfuscated_matches:
                        raw_emails.append(f"{m[0]}@{m[1]}.{m[2]}")

                    seen_emails = set()
                    for email in raw_emails:
                        cleaned = _clean_email(email)
                        if cleaned and cleaned not in seen_emails:
                            seen_emails.add(cleaned)
                            result.emails.append(cleaned)
                    result.emails = result.emails[:5]  # max 5 emails

                    # Phones
                    raw_phones = PHONE_REGEX.findall(full_text)
                    seen_phones = set()
                    for phone in raw_phones:
                        phone = phone.strip()
                        if phone and phone not in seen_phones and len(phone) >= 10:
                            seen_phones.add(phone)
                            result.phones.append(phone)
                    result.phones = result.phones[:3]  # max 3 phones

                    # Social media
                    for platform, pattern in SOCIAL_PATTERNS.items():
                        matches = pattern.findall(full_html)
                        if matches:
                            cleaned = _clean_social(matches[0])
                            if cleaned:
                                setattr(result, f"{platform}_url", cleaned)

                    # Feature detection
                    html_lower = full_html.lower()
                    result.has_contact_form = any(
                        kw in html_lower for kw in ["<form", "contact form", "send message", "submit form"]
                    )
                    result.has_cta_button = any(
                        kw in html_lower for kw in [
                            "get quote", "book now", "schedule", "free consultation",
                            "get started", "call now", "contact us", "request"
                        ]
                    )
                    result.has_social_links = any([
                        result.facebook_url, result.instagram_url,
                        result.linkedin_url, result.twitter_url
                    ])

                    result.success = result.pages_crawled > 0

                finally:
                    await context.close()
                    await browser.close()

        except Exception as e:
            result.error = str(e)
            logger.warning(f"Crawl failed for {website}: {e}")

        return result


class SimpleCrawler:
    """
    Lightweight HTTP-based crawler using requests + BeautifulSoup.
    Used as fallback when Playwright is unavailable.
    """

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; LeadForgeBot/1.0; +https://techarbor.com/bot)",
        }

    async def crawl(self, website: str) -> CrawlResult:
        """Crawl using simple HTTP requests."""
        result = CrawlResult(website)
        result.ssl_enabled = website.startswith("https://")

        try:
            import httpx
            from bs4 import BeautifulSoup

            base_url = website.rstrip("/")
            all_content = []

            async with httpx.AsyncClient(
                headers=self.headers,
                timeout=self.timeout,
                follow_redirects=True,
                verify=False,
            ) as client:
                for path in ["/", "/contact", "/about"]:
                    url = f"{base_url}{path}" if path != "/" else base_url
                    try:
                        response = await client.get(url)
                        if response.status_code == 200:
                            all_content.append(response.text)
                            result.pages_crawled += 1
                            await asyncio.sleep(1)
                    except Exception:
                        continue

            full_html = " ".join(all_content)

            if not full_html:
                return result

            soup = BeautifulSoup(full_html, "html.parser")

            # Title + meta
            if soup.title:
                result.page_title = soup.title.string
            meta = soup.find("meta", attrs={"name": "description"})
            if meta:
                result.meta_description = meta.get("content")

            # Text content
            full_text = soup.get_text(separator=" ")

            # Emails
            raw_emails = EMAIL_REGEX.findall(full_text) + EMAIL_REGEX.findall(full_html)
            
            # Explicitly check mailto links
            mailto_matches = re.findall(r'href=[\'"]mailto:([^\'"]+)[\'"]', full_html, re.IGNORECASE)
            for match in mailto_matches:
                clean_match = match.split('?')[0].strip()
                if clean_match:
                    raw_emails.append(clean_match)
                    
            # Find obfuscated emails (e.g. info [at] domain [dot] com)
            obfuscated_matches = re.findall(r'\b([A-Za-z0-9._%+\-]+)\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([A-Za-z0-9.\-]+)\s*(?:\[dot\]|\(dot\)|\s+dot\s+)\s*([A-Za-z]{2,})\b', full_text, re.IGNORECASE)
            for m in obfuscated_matches:
                raw_emails.append(f"{m[0]}@{m[1]}.{m[2]}")

            seen = set()
            for email in raw_emails:
                cleaned = _clean_email(email)
                if cleaned and cleaned not in seen:
                    seen.add(cleaned)
                    result.emails.append(cleaned)
            result.emails = result.emails[:5]

            # Phones
            raw_phones = PHONE_REGEX.findall(full_text)
            seen_phones = set()
            for phone in raw_phones:
                phone = phone.strip()
                if phone not in seen_phones and len(phone) >= 10:
                    seen_phones.add(phone)
                    result.phones.append(phone)
            result.phones = result.phones[:3]

            # Social
            for platform, pattern in SOCIAL_PATTERNS.items():
                matches = pattern.findall(full_html)
                if matches:
                    cleaned = _clean_social(matches[0])
                    if cleaned:
                        setattr(result, f"{platform}_url", cleaned)

            # Feature detection
            html_lower = full_html.lower()
            result.has_contact_form = "<form" in html_lower
            result.has_cta_button = any(
                kw in html_lower for kw in ["get quote", "book now", "schedule", "contact us"]
            )
            result.has_social_links = any([
                result.facebook_url, result.instagram_url,
                result.linkedin_url, result.twitter_url
            ])

            result.success = True

        except Exception as e:
            result.error = str(e)
            logger.warning(f"Simple crawl failed for {website}: {e}")

        return result
