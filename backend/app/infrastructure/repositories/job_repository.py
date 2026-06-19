"""
LeadForge AI — Job & User Repositories
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models import SearchJob, User, Industry, JobStatus


class SearchJobRepository:
    """Database operations for SearchJob."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> SearchJob:
        job = SearchJob(**data)
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def get_by_id(self, job_id: UUID) -> Optional[SearchJob]:
        result = await self.db.execute(
            select(SearchJob)
            .options(selectinload(SearchJob.user), selectinload(SearchJob.industry))
            .where(SearchJob.id == job_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, user_id: Optional[UUID] = None, skip: int = 0, limit: int = 20) -> tuple[List[SearchJob], int]:
        query = select(SearchJob).options(selectinload(SearchJob.user))
        if user_id:
            query = query.where(SearchJob.user_id == user_id)

        count_q = select(func.count()).select_from(SearchJob)
        if user_id:
            count_q = count_q.where(SearchJob.user_id == user_id)
        total = (await self.db.execute(count_q)).scalar_one()

        query = query.order_by(desc(SearchJob.created_at)).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update_progress(self, job_id: UUID, progress: int, step: str, **kwargs) -> None:
        update_data = {"progress": progress, "current_step": step, **kwargs}
        await self.db.execute(
            update(SearchJob).where(SearchJob.id == job_id).values(**update_data)
        )
        await self.db.flush()

    async def mark_started(self, job_id: UUID, celery_task_id: str) -> None:
        await self.db.execute(
            update(SearchJob).where(SearchJob.id == job_id).values(
                status=JobStatus.RUNNING,
                started_at=datetime.utcnow(),
                celery_task_id=celery_task_id,
            )
        )
        await self.db.flush()

    async def mark_completed(self, job_id: UUID, stats: Dict[str, Any]) -> None:
        await self.db.execute(
            update(SearchJob).where(SearchJob.id == job_id).values(
                status=JobStatus.COMPLETED,
                progress=100,
                completed_at=datetime.utcnow(),
                current_step="Completed",
                **stats,
            )
        )
        await self.db.flush()

    async def mark_failed(self, job_id: UUID, error: str) -> None:
        await self.db.execute(
            update(SearchJob).where(SearchJob.id == job_id).values(
                status=JobStatus.FAILED,
                error_message=error,
                completed_at=datetime.utcnow(),
            )
        )
        await self.db.flush()

    async def mark_cancelled(self, job_id: UUID) -> None:
        await self.db.execute(
            update(SearchJob).where(SearchJob.id == job_id).values(status=JobStatus.CANCELLED)
        )
        await self.db.flush()

    async def append_log(self, job_id: UUID, message: str) -> None:
        """Append a log message to the job's logs array."""
        job = await self.db.get(SearchJob, job_id)
        if job:
            logs = list(job.logs or [])
            logs.append({"ts": datetime.utcnow().isoformat(), "msg": message})
            job.logs = logs
            await self.db.flush()


class UserRepository:
    """Database operations for User."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> User:
        user = User(**data)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(self) -> List[User]:
        result = await self.db.execute(select(User).order_by(User.created_at))
        return list(result.scalars().all())

    async def update(self, user_id: UUID, data: Dict[str, Any]) -> Optional[User]:
        await self.db.execute(update(User).where(User.id == user_id).values(**data))
        await self.db.flush()
        return await self.get_by_id(user_id)


class IndustryRepository:
    """Database operations for Industry."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Industry:
        industry = Industry(**data)
        self.db.add(industry)
        await self.db.flush()
        await self.db.refresh(industry)
        return industry

    async def get_all(self, search: Optional[str] = None) -> List[Industry]:
        query = select(Industry).where(Industry.is_active == True)
        if search:
            query = query.where(Industry.name.ilike(f"%{search}%"))
        query = query.order_by(Industry.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_name(self, name: str) -> Optional[Industry]:
        result = await self.db.execute(
            select(Industry).where(Industry.name.ilike(name))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, industry_id: UUID) -> Optional[Industry]:
        result = await self.db.execute(select(Industry).where(Industry.id == industry_id))
        return result.scalar_one_or_none()
