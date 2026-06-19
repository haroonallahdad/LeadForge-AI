"""
LeadForge AI — Export, Analytics, Industries, Email Gen API Routes
"""
import os
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.lead_repository import LeadRepository
from app.infrastructure.repositories.job_repository import IndustryRepository
from app.application.services.export_service import export_to_csv, export_to_xlsx
from app.application.services.email_generator import generate_email_draft
from app.api.deps import get_current_user

export_router = APIRouter(prefix="/export", tags=["Export"])
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])
industries_router = APIRouter(prefix="/industries", tags=["Industries"])
email_router = APIRouter(prefix="/email", tags=["Email Generator"])


# ─────────────────────────────────────────────────────────────────────────────
# Export Routes
# ─────────────────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    format: str = "csv"  # "csv" or "xlsx"
    lead_ids: Optional[List[str]] = None  # None = export all
    filters: Optional[dict] = None


@export_router.post("")
async def export_leads(
    data: ExportRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export leads to CSV or Excel."""
    lead_repo = LeadRepository(db)

    lead_ids = [UUID(lid) for lid in data.lead_ids] if data.lead_ids else None
    leads = await lead_repo.get_export_data(lead_ids=lead_ids)

    if not leads:
        raise HTTPException(status_code=404, detail="No leads found to export")

    if data.format == "xlsx":
        filepath = await export_to_xlsx(leads)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        filepath = await export_to_csv(leads)
        media_type = "text/csv"

    # Record export history
    from app.infrastructure.database.models import ExportHistory, ExportFormat
    hist = ExportHistory(
        user_id=current_user.id,
        format=ExportFormat(data.format),
        row_count=len(leads),
        file_path=filepath,
        file_size_bytes=os.path.getsize(filepath) if os.path.exists(filepath) else 0,
    )
    db.add(hist)
    await db.commit()

    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        media_type=media_type,
        filename=filename,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Analytics Routes
# ─────────────────────────────────────────────────────────────────────────────

@analytics_router.get("")
async def get_analytics(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard analytics summary."""
    lead_repo = LeadRepository(db)
    data = await lead_repo.get_analytics()

    # Export count
    from sqlalchemy import select, func
    from app.infrastructure.database.models import ExportHistory, SearchJob
    export_count = await db.execute(select(func.count()).select_from(ExportHistory))
    job_count = await db.execute(select(func.count()).select_from(SearchJob))

    data["total_exports"] = export_count.scalar_one()
    data["total_jobs"] = job_count.scalar_one()

    total = data["total_leads"]
    contacted = data["contacted_leads"]
    closed_won = data["closed_won"]
    data["conversion_rate"] = round(closed_won / max(total, 1) * 100, 1)
    data["contact_rate"] = round(contacted / max(total, 1) * 100, 1)

    return data


# ─────────────────────────────────────────────────────────────────────────────
# Industries Routes
# ─────────────────────────────────────────────────────────────────────────────

class CreateIndustryRequest(BaseModel):
    name: str
    category: Optional[str] = None
    aliases: Optional[List[str]] = None


@industries_router.get("")
async def list_industries(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all industries (no auth required for autocomplete)."""
    industry_repo = IndustryRepository(db)
    industries = await industry_repo.get_all(search=search)
    return [
        {
            "id": str(i.id),
            "name": i.name,
            "category": i.category,
            "aliases": i.aliases,
            "is_custom": i.is_custom,
        }
        for i in industries
    ]


@industries_router.post("", status_code=201)
async def create_industry(
    data: CreateIndustryRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom industry."""
    industry_repo = IndustryRepository(db)
    existing = await industry_repo.get_by_name(data.name)
    if existing:
        raise HTTPException(status_code=400, detail="Industry already exists")

    industry = await industry_repo.create({
        "name": data.name,
        "category": data.category,
        "aliases": data.aliases or [],
        "is_custom": True,
    })
    await db.commit()
    return {"id": str(industry.id), "name": industry.name}


# ─────────────────────────────────────────────────────────────────────────────
# Email Generator Routes
# ─────────────────────────────────────────────────────────────────────────────

class GenerateEmailRequest(BaseModel):
    company_name: str
    executive_name: Optional[str] = None
    industry: Optional[str] = None
    website_issues: Optional[List[str]] = None
    recommended_services: Optional[List[str]] = None
    tone: str = "professional"  # professional | friendly | short
    opportunity_notes: Optional[str] = None


@email_router.post("/generate")
async def generate_email(
    data: GenerateEmailRequest,
    current_user=Depends(get_current_user),
):
    """Generate a personalized email draft for manual outreach."""
    draft = generate_email_draft(
        company_name=data.company_name,
        executive_name=data.executive_name,
        industry=data.industry,
        website_issues=data.website_issues or [],
        recommended_services=data.recommended_services or ["Web Development"],
        tone=data.tone,
        opportunity_notes=data.opportunity_notes,
    )
    return draft
