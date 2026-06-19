"""
LeadForge AI — Lead Scoring Engine
Calculates opportunity scores (0-500) based on website quality, reviews,
and online presence. Higher scores = better opportunities for Tech Harbor.
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass


# ─────────────────────────────────────────────────────────────────────────────
# Scoring weights
# ─────────────────────────────────────────────────────────────────────────────

SCORE_NO_WEBSITE = 100           # Biggest opportunity — needs web dev
SCORE_WEBSITE_OUTDATED = 50      # Old/poor website — needs redesign
SCORE_NO_SSL = 20                # No HTTPS — security/trust issue
SCORE_GOOD_RATING = 30           # Rating >= 4.0 — serious business worth pursuing
SCORE_HIGH_REVIEW_COUNT = 20     # >20 reviews — established business
SCORE_NO_CONTACT_FORM = 15       # Missing contact form — UX improvement needed
SCORE_NO_SEO = 15                # Missing SEO metadata — SEO opportunity
SCORE_NO_MOBILE = 20             # Not mobile responsive — dev opportunity
SCORE_ACTIVE_SOCIAL = 10         # Has social media — engageable
SCORE_NO_CTA = 10                # Missing CTA — conversion optimization needed
SCORE_LOW_REVIEW_COUNT = 10      # < 5 reviews — social proof opportunity

MAX_POSSIBLE_SCORE = 500


@dataclass
class ScoringInput:
    """All data needed to calculate a lead score."""
    # Website
    has_website: bool = False
    website_score: int = 0  # 0-100 from website analysis
    ssl_enabled: bool = False
    mobile_responsive: bool = False
    has_contact_form: bool = False
    has_cta: bool = False
    has_seo_title: bool = False
    has_seo_description: bool = False

    # Reviews
    rating: Optional[float] = None
    review_count: Optional[int] = None

    # Social
    has_facebook: bool = False
    has_instagram: bool = False
    has_linkedin: bool = False
    has_twitter: bool = False

    # Company
    estimated_employees: Optional[int] = None


@dataclass
class ScoringResult:
    """Detailed lead scoring result."""
    total_score: int
    breakdown: Dict[str, int]
    grade: str  # A+, A, B, C, D
    improvement_suggestions: list[str]
    recommended_services: list[str]
    opportunity_notes: str


def calculate_lead_score(inputs: ScoringInput) -> ScoringResult:
    """
    Calculate lead score based on website quality, reviews, and online presence.
    Returns a detailed breakdown of points and recommendations.
    """
    breakdown = {}
    suggestions = []
    recommended_services = []

    # ── Website Score ─────────────────────────────────────────────────────────
    if not inputs.has_website:
        breakdown["no_website"] = SCORE_NO_WEBSITE
        suggestions.append("No website found — create a professional web presence")
        recommended_services.extend(["Web Development", "Graphic Designing"])
    else:
        # Website exists — evaluate quality
        if inputs.website_score < 50:
            breakdown["outdated_website"] = SCORE_WEBSITE_OUTDATED
            suggestions.append("Website appears outdated or poorly designed")
            recommended_services.extend(["Web Development"])

        if not inputs.ssl_enabled:
            breakdown["no_ssl"] = SCORE_NO_SSL
            suggestions.append("Website lacks SSL (HTTPS) — security risk")
            recommended_services.append("Cybersecurity Services")

        if not inputs.mobile_responsive:
            breakdown["not_mobile"] = SCORE_NO_MOBILE
            suggestions.append("Website is not mobile-responsive")
            recommended_services.append("Web Development")

        if not inputs.has_contact_form:
            breakdown["no_contact_form"] = SCORE_NO_CONTACT_FORM
            suggestions.append("No contact form — harder for customers to reach them")
            recommended_services.append("Web Development")

        if not inputs.has_cta:
            breakdown["no_cta"] = SCORE_NO_CTA
            suggestions.append("Missing clear call-to-action buttons")
            recommended_services.append("Web Development")

        if not inputs.has_seo_title or not inputs.has_seo_description:
            breakdown["no_seo"] = SCORE_NO_SEO
            suggestions.append("Missing SEO metadata (title/description)")
            recommended_services.append("SEO Services")

    # ── Reviews Score ─────────────────────────────────────────────────────────
    if inputs.rating is not None and inputs.rating >= 4.0:
        breakdown["good_rating"] = SCORE_GOOD_RATING
        # High rating means trustworthy business, worth pursuing

    if inputs.review_count is not None:
        if inputs.review_count > 20:
            breakdown["high_review_count"] = SCORE_HIGH_REVIEW_COUNT
        elif inputs.review_count < 5:
            breakdown["low_reviews"] = SCORE_LOW_REVIEW_COUNT
            suggestions.append("Low review count — social proof strategy needed")

    # ── Social Media Score ────────────────────────────────────────────────────
    social_count = sum([
        inputs.has_facebook, inputs.has_instagram,
        inputs.has_linkedin, inputs.has_twitter
    ])
    if social_count > 0:
        breakdown["has_social_media"] = SCORE_ACTIVE_SOCIAL
    else:
        suggestions.append("No social media presence detected")
        recommended_services.extend(["Social Media Management", "Ads Marketing"])

    # ── Calculate Total ───────────────────────────────────────────────────────
    total = min(sum(breakdown.values()), MAX_POSSIBLE_SCORE)

    # ── Grade ─────────────────────────────────────────────────────────────────
    if total >= 180:
        grade = "A+"
    elif total >= 140:
        grade = "A"
    elif total >= 100:
        grade = "B"
    elif total >= 60:
        grade = "C"
    else:
        grade = "D"

    # ── Opportunity Notes ─────────────────────────────────────────────────────
    opportunity_notes = _generate_opportunity_notes(inputs, total, breakdown, suggestions)

    # Deduplicate services
    recommended_services = list(dict.fromkeys(recommended_services))

    return ScoringResult(
        total_score=total,
        breakdown=breakdown,
        grade=grade,
        improvement_suggestions=suggestions,
        recommended_services=recommended_services,
        opportunity_notes=opportunity_notes,
    )


def calculate_website_score(crawl_data: Dict[str, Any]) -> int:
    """
    Calculate a website quality score 0-100.
    Used for the website_score field on WebsiteAnalysis.
    """
    score = 0

    if crawl_data.get("ssl_enabled"):
        score += 20
    if crawl_data.get("has_contact_form"):
        score += 15
    if crawl_data.get("has_cta_button"):
        score += 15
    if crawl_data.get("has_social_links"):
        score += 10
    if crawl_data.get("page_title"):
        score += 15
    if crawl_data.get("meta_description"):
        score += 15
    if crawl_data.get("pages_crawled", 0) >= 3:
        score += 10  # Site is accessible and has content

    return min(score, 100)


def _generate_opportunity_notes(
    inputs: ScoringInput,
    score: int,
    breakdown: Dict[str, int],
    suggestions: list,
) -> str:
    """Generate AI-style opportunity notes for the lead."""
    company_context = []
    opportunity_context = []

    # Company strengths
    if inputs.rating and inputs.rating >= 4.0:
        company_context.append(f"excellent customer reviews ({inputs.rating}★)")
    if inputs.review_count and inputs.review_count > 50:
        company_context.append(f"a strong local reputation ({inputs.review_count} reviews)")
    if inputs.has_facebook or inputs.has_instagram:
        company_context.append("an active social media presence")

    # Opportunities
    if not inputs.has_website:
        opportunity_context.append("no online presence whatsoever")
    elif inputs.website_score < 50:
        opportunity_context.append("an outdated website in need of modernization")

    if not inputs.ssl_enabled and inputs.has_website:
        opportunity_context.append("a website without SSL security")

    if not inputs.has_seo_title or not inputs.has_seo_description:
        opportunity_context.append("missing SEO metadata limiting their search visibility")

    if not inputs.has_contact_form:
        opportunity_context.append("no easy way for customers to contact them online")

    # Build note
    strengths = f"This business has {', '.join(company_context)}." if company_context else ""
    opps = f"They have {', and '.join(opportunity_context)}." if opportunity_context else ""

    if score >= 150:
        urgency = "This is a high-value lead with significant growth potential."
    elif score >= 100:
        urgency = "This is a solid opportunity with clear service needs."
    else:
        urgency = "This lead shows moderate opportunity for improvement."

    note = " ".join(filter(None, [strengths, opps, urgency]))

    if not note.strip():
        note = "This business has been identified as a potential opportunity based on their current digital presence. A personalized outreach is recommended."

    return note
