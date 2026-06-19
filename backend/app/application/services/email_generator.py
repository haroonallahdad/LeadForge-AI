"""
LeadForge AI — Email Draft Generator
Produces professional, personalized email drafts for manual outreach.
NO automated sending — drafts only, copy-paste by user.
"""
from typing import Optional, List
from app.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# Service catalog
# ─────────────────────────────────────────────────────────────────────────────

SERVICE_DESCRIPTIONS = {
    "Web Development": "a modern, fast, and conversion-optimized website",
    "Mobile Application Development": "a native mobile app for iOS and Android",
    "Custom Software Development": "custom business software tailored to your operations",
    "Graphic Designing": "a cohesive brand identity and professional design system",
    "Social Media Management": "consistent and engaging social media content",
    "Ads Marketing": "targeted digital advertising campaigns",
    "SEO Services": "improved search engine rankings and organic traffic",
    "Cybersecurity Services": "robust security measures and SSL/HTTPS setup",
    "Automation Solutions": "workflow automation to save time and reduce manual work",
}

TONES = {
    "professional": {
        "greeting": "Dear",
        "opener": "I hope this message finds you well.",
        "closing": "I look forward to hearing from you.",
        "sign_off": "Best regards",
    },
    "friendly": {
        "greeting": "Hi",
        "opener": "I came across your business and wanted to reach out!",
        "closing": "Would love to chat more about how we can help.",
        "sign_off": "Cheers",
    },
    "short": {
        "greeting": "Hi",
        "opener": "Quick note —",
        "closing": "Worth a quick call?",
        "sign_off": "Best",
    },
}


def generate_email_draft(
    company_name: str,
    executive_name: Optional[str],
    industry: Optional[str],
    website_issues: List[str],
    recommended_services: List[str],
    tone: str = "professional",
    opportunity_notes: Optional[str] = None,
) -> dict:
    """
    Generate a personalized email draft for manual outreach.

    Returns:
        dict with subject, body, and cta fields
    """
    tone_config = TONES.get(tone, TONES["professional"])
    recipient = executive_name or f"the team at {company_name}"
    primary_service = recommended_services[0] if recommended_services else "Web Development"
    service_desc = SERVICE_DESCRIPTIONS.get(primary_service, "digital solutions")

    # Subject line
    if "Web Development" in recommended_services or "no_website" in str(website_issues):
        subject = f"Helping {company_name} Get Found Online"
    elif "SEO Services" in recommended_services:
        subject = f"Quick SEO Opportunity for {company_name}"
    elif "Social Media Management" in recommended_services:
        subject = f"Grow {company_name}'s Online Presence"
    else:
        subject = f"A Digital Growth Opportunity for {company_name}"

    # Issues paragraph
    if website_issues:
        issues_text = ", ".join(website_issues[:3])
        issues_paragraph = (
            f"We noticed that {company_name} could benefit from some digital improvements — "
            f"specifically: {issues_text}. "
        )
    else:
        issues_paragraph = (
            f"We've been researching businesses in the {industry or 'local'} space and came across {company_name}. "
        )

    # Services paragraph
    if len(recommended_services) > 1:
        services_list = ", ".join(recommended_services[:3])
        services_text = f"We specialize in {services_list} — all tailored for local businesses like yours."
    else:
        services_text = f"At Tech Harbor, we specialize in {service_desc} for {industry or 'local'} businesses."

    # Build email body based on tone
    if tone == "short":
        body = (
            f"{tone_config['greeting']} {recipient},\n\n"
            f"{tone_config['opener']} {issues_paragraph.strip()}\n\n"
            f"We help businesses like {company_name} with {service_desc}.\n\n"
            f"{tone_config['closing']}\n\n"
            f"{tone_config['sign_off']},\n"
            f"[Your Name]\n"
            f"Tech Harbor\n"
            f"[Your Phone] | [Your Email]"
        )
    else:
        body = (
            f"{tone_config['greeting']} {recipient},\n\n"
            f"{tone_config['opener']}\n\n"
            f"{issues_paragraph}"
            f"{services_text}\n\n"
            f"We've helped many {industry or 'local'} businesses improve their digital presence, "
            f"attract more customers, and grow their revenue — without any complicated processes.\n\n"
            f"I'd love to offer you a free 15-minute consultation to discuss how we can specifically "
            f"help {company_name}. There's absolutely no obligation.\n\n"
            f"{tone_config['closing']}\n\n"
            f"{tone_config['sign_off']},\n"
            f"[Your Name]\n"
            f"Tech Harbor — Digital Solutions\n"
            f"[Your Phone] | hello@techarbor.com | techarbor.com"
        )

    cta = "Schedule a Free 15-Minute Consultation"

    return {
        "subject": subject,
        "body": body,
        "cta": cta,
        "tone": tone,
        "recipient": recipient,
        "recommended_services": recommended_services,
    }
