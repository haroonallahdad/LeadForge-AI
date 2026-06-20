"""
LeadForge AI — Search & Jobs API Routes
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.job_repository import SearchJobRepository, IndustryRepository
from app.infrastructure.database.models import JobStatus
from app.api.deps import get_current_user
from app.workers.tasks.search_tasks import run_search_pipeline

router = APIRouter(tags=["Search & Jobs"])


class SearchRequest(BaseModel):
    industry: str = Field(..., min_length=2, max_length=200)
    country: str = Field(default="USA", min_length=2)
    state: Optional[str] = None
    city: Optional[str] = None
    lead_count: int = Field(default=50, ge=5, le=500)


def _serialize_job(job) -> dict:
    return {
        "id": str(job.id),
        "industry_name": job.industry_name,
        "country": job.country,
        "state": job.state,
        "city": job.city,
        "lead_count": job.lead_count,
        "status": job.status.value,
        "progress": job.progress,
        "current_step": job.current_step,
        "total_found": job.total_found,
        "total_crawled": job.total_crawled,
        "total_scored": job.total_scored,
        "error_message": job.error_message,
        "logs": job.logs or [],
        "celery_task_id": job.celery_task_id,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "user": {"id": str(job.user.id), "email": job.user.email} if job.user else None,
    }


@router.post("/search", status_code=202)
async def start_search(
    data: SearchRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new background search job (Celery if available, else asyncio task)."""
    job_repo = SearchJobRepository(db)

    # ---------------------------------------------------------
    # Subscription Quota Checks
    # ---------------------------------------------------------
    if current_user.subscription_plan == "FREE" and data.lead_count > 10:
        raise HTTPException(status_code=403, detail="Free plan is limited to 10 leads per search. Please upgrade.")
        
    if current_user.subscription_plan in ["FREE", "SIMPLE"]:
        from datetime import datetime, timezone
        from sqlalchemy import select, func
        from app.infrastructure.database.models import SearchJob
        
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        result = await db.execute(
            select(func.sum(SearchJob.lead_count))
            .where(SearchJob.user_id == current_user.id)
            .where(SearchJob.created_at >= start_of_month)
        )
        total_leads_this_month = result.scalar() or 0
        
        if current_user.subscription_plan == "FREE" and (total_leads_this_month + data.lead_count > 50):
            raise HTTPException(status_code=403, detail="Free plan monthly limit reached (50 leads). Please upgrade.")
            
        if current_user.subscription_plan == "SIMPLE" and (total_leads_this_month + data.lead_count > 500):
            raise HTTPException(status_code=403, detail="Simple plan monthly limit reached (500 leads). Please upgrade to Premium.")

    # Look up or match industry
    industry_repo = IndustryRepository(db)
    industry = await industry_repo.get_by_name(data.industry)

    job = await job_repo.create({
        "user_id": current_user.id,
        "industry_id": industry.id if industry else None,
        "industry_name": data.industry,
        "country": data.country,
        "state": data.state,
        "city": data.city,
        "lead_count": data.lead_count,
        "status": JobStatus.QUEUED,
    })
    await db.commit()

    job_id = str(job.id)
    task_id = None

    # Try Celery first, fall back to asyncio background task
    try:
        task = run_search_pipeline.delay(job_id)
        task_id = task.id
    except Exception:
        # No Redis/Celery available — run in FastAPI background task
        import asyncio
        from app.workers.tasks.search_tasks import _run_pipeline_async
        background_tasks.add_task(_run_pipeline_async, job_id)
        task_id = f"bg-{job_id[:8]}"

    return {
        "job_id": job_id,
        "task_id": task_id,
        "status": "queued",
        "message": f"Search job queued for {data.industry} in {data.city or data.country}",
    }


@router.get("/jobs")
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all search jobs for the current user."""
    job_repo = SearchJobRepository(db)
    jobs, total = await job_repo.get_all(user_id=current_user.id, skip=skip, limit=limit)
    return {
        "total": total,
        "items": [_serialize_job(j) for j in jobs],
    }


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a job's status, progress, and logs."""
    job_repo = SearchJobRepository(db)
    job = await job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize_job(job)


@router.delete("/jobs/{job_id}", status_code=204)
async def cancel_job(
    job_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a queued or running job."""
    job_repo = SearchJobRepository(db)
    job = await job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Job cannot be cancelled in current state")

    # Revoke Celery task (if it's an actual Celery task and Redis is available)
    if job.celery_task_id and not job.celery_task_id.startswith("bg-"):
        try:
            from app.workers.celery_app import celery_app
            celery_app.control.revoke(job.celery_task_id, terminate=True)
        except Exception as e:
            # Ignore connection errors if Redis isn't running
            import logging
            logging.getLogger(__name__).warning(f"Could not revoke celery task (possibly no Redis): {e}")

    await job_repo.mark_cancelled(job_id)
    await db.commit()


@router.delete("/jobs/{job_id}/remove", status_code=204)
async def delete_job(
    job_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a job and all its leads."""
    job_repo = SearchJobRepository(db)
    job = await job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    await job_repo.db.delete(job)
    await db.commit()
