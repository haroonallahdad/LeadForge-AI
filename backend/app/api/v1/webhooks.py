"""
LeadForge AI — Webhooks API
Allows users to configure a custom webhook URL that receives lead payloads
automatically. Works with Zapier, n8n, Make.com, HubSpot, GoHighLevel, etc.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, HttpUrl
from app.infrastructure.database.session import get_db
from app.api.deps import get_current_user
import logging
import requests

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)


class WebhookPayload(BaseModel):
    url: str


@router.get("/")
async def get_webhook(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the user's current saved webhook URL."""
    return {
        "webhook_url": current_user.webhook_url or "",
        "is_active": bool(current_user.webhook_url),
    }


@router.post("/")
async def save_webhook(
    data: WebhookPayload,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save or update the user's webhook URL."""
    current_user.webhook_url = data.url.strip() if data.url.strip() else None
    await db.commit()
    return {"status": "saved", "webhook_url": current_user.webhook_url}


@router.delete("/")
async def delete_webhook(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove the user's webhook URL."""
    current_user.webhook_url = None
    await db.commit()
    return {"status": "removed"}


@router.post("/test")
async def test_webhook(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fire a sample lead payload at the user's saved webhook URL."""
    if not current_user.webhook_url:
        raise HTTPException(status_code=400, detail="No webhook URL configured. Save a URL first.")

    sample_payload = {
        "event": "lead.created",
        "source": "LeadForge AI",
        "timestamp": "2026-06-20T12:00:00Z",
        "lead": {
            "id": "test-lead-abc123",
            "company_name": "Acme Dental Group",
            "industry": "Dental Clinics",
            "city": "Austin",
            "state": "TX",
            "country": "USA",
            "website": "https://acme-dental.example.com",
            "email": "info@acme-dental.example.com",
            "phone": "+1-512-555-0199",
            "lead_score": 187,
            "rating": 4.2,
            "review_count": 88,
            "status": "new",
        },
    }

    try:
        resp = requests.post(
            current_user.webhook_url,
            json=sample_payload,
            timeout=10,
            headers={"Content-Type": "application/json", "User-Agent": "LeadForge-AI/1.0"},
        )
        return {
            "status": "delivered",
            "http_status": resp.status_code,
            "response_preview": resp.text[:200],
        }
    except Exception as e:
        logger.error(f"Webhook test failed for user {current_user.id}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to reach webhook URL: {str(e)}")
