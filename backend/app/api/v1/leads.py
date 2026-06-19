"""
LeadForge AI — Leads API Routes
CRUD + filtering + pagination for leads.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.lead_repository import LeadRepository
from app.api.deps import get_current_user

router = APIRouter(prefix="/leads", tags=["Leads"])


class UpdateLeadRequest(BaseModel):
    status: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None


class AddNoteRequest(BaseModel):
    content: str


def _serialize_lead_list(lead) -> dict:
    """Minimal serialization for list views."""
    contacts = lead.contact_info or []
    emails = [c.email for c in contacts if c.email]
    phones = [c.phone for c in contacts if c.phone]
    primary = contacts[0] if contacts else None

    return {
        "id": str(lead.id),
        "company_name": lead.company_name,
        "industry": lead.industry,
        "country": lead.country,
        "state": lead.state,
        "city": lead.city,
        "website": lead.website,
        "emails": emails,
        "phones": phones,
        "facebook_url": primary.facebook_url if primary else None,
        "instagram_url": primary.instagram_url if primary else None,
        "linkedin_url": primary.linkedin_url if primary else None,
        "rating": lead.rating,
        "review_count": lead.review_count,
        "lead_score": lead.lead_score,
        "website_score": lead.website_score,
        "status": lead.status.value if lead.status else "new",
        "tags": [{"id": str(t.id), "name": t.name, "color": t.color} for t in lead.tags],
        "source": lead.source,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }


def _serialize_lead_detail(lead) -> dict:
    """Full serialization for detail views."""
    base = _serialize_lead_list(lead)
    contacts = lead.contact_info or []
    wa = lead.website_analysis
    execs = lead.executive_info or []
    insight = lead.opportunity_insight
    notes = lead.notes or []
    history = lead.contact_history or []

    base.update({
        "address": lead.address,
        "description": lead.description,
        "source_id": lead.source_id,
        "is_duplicate": lead.is_duplicate,
        "contact_info": [
            {
                "id": str(c.id),
                "email": c.email,
                "phone": c.phone,
                "facebook_url": c.facebook_url,
                "instagram_url": c.instagram_url,
                "linkedin_url": c.linkedin_url,
                "twitter_url": c.twitter_url,
                "youtube_url": c.youtube_url,
                "source": c.source,
            }
            for c in contacts
        ],
        "website_analysis": {
            "website_exists": wa.website_exists,
            "ssl_enabled": wa.ssl_enabled,
            "mobile_responsive": wa.mobile_responsive,
            "has_contact_form": wa.has_contact_form,
            "has_cta_button": wa.has_cta_button,
            "has_social_links": wa.has_social_links,
            "has_seo_title": wa.has_seo_title,
            "has_seo_description": wa.has_seo_description,
            "website_score": wa.website_score,
            "page_title": wa.page_title,
            "meta_description": wa.meta_description,
            "improvement_summary": wa.improvement_summary,
        } if wa else None,
        "executives": [
            {
                "id": str(e.id),
                "name": e.executive_name,
                "position": e.position,
                "linkedin": e.linkedin_profile,
            }
            for e in execs
        ],
        "opportunity_insight": {
            "ai_notes": insight.ai_notes,
            "manual_notes": insight.manual_notes,
            "recommended_services": insight.recommended_services,
        } if insight else None,
        "notes": [
            {"id": str(n.id), "content": n.content, "created_at": n.created_at.isoformat()}
            for n in notes
        ],
        "contact_history": [
            {
                "id": str(h.id),
                "action": h.action,
                "notes": h.notes,
                "timestamp": h.timestamp.isoformat(),
            }
            for h in history
        ],
    })
    return base


@router.get("")
async def list_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    industry: Optional[str] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    sort_by: str = "lead_score",
    sort_dir: str = "desc",
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated, filtered, sorted leads."""
    lead_repo = LeadRepository(db)
    leads, total = await lead_repo.get_all(
        skip=skip, limit=limit, search=search, status=status,
        industry=industry, country=country, state=state, city=city,
        min_score=min_score, max_score=max_score,
        sort_by=sort_by, sort_dir=sort_dir,
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [_serialize_lead_list(l) for l in leads],
    }


@router.get("/{lead_id}")
async def get_lead(
    lead_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full lead details."""
    lead_repo = LeadRepository(db)
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _serialize_lead_detail(lead)


@router.put("/{lead_id}")
async def update_lead(
    lead_id: UUID,
    data: UpdateLeadRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a lead's status, website, or other mutable fields."""
    lead_repo = LeadRepository(db)
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = data.model_dump(exclude_none=True)
    lead = await lead_repo.update(lead_id, update_data)
    await db.commit()
    return _serialize_lead_detail(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a lead permanently."""
    lead_repo = LeadRepository(db)
    deleted = await lead_repo.delete(lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.commit()


@router.post("/{lead_id}/notes", status_code=201)
async def add_note(
    lead_id: UUID,
    data: AddNoteRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a note to a lead."""
    from app.infrastructure.database.models import Note
    note = Note(lead_id=lead_id, user_id=current_user.id, content=data.content)
    db.add(note)
    await db.commit()
    return {"id": str(note.id), "content": note.content}


@router.post("/{lead_id}/history", status_code=201)
async def add_contact_history(
    lead_id: UUID,
    data: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a contact event for a lead."""
    from app.infrastructure.database.models import ContactHistory
    history = ContactHistory(
        lead_id=lead_id,
        user_id=current_user.id,
        action=data.get("action", ""),
        notes=data.get("notes"),
    )
    db.add(history)
    await db.commit()
    return {"id": str(history.id)}
