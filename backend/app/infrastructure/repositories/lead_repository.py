"""
LeadForge AI — Lead Repository
Repository pattern for all Lead-related database operations.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, or_, desc, asc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models import Lead, ContactInfo, WebsiteAnalysis, ExecutiveInfo, OpportunityInsight, Tag, LeadStatus


class LeadRepository:
    """All database interactions for the Lead aggregate."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Lead:
        """Create a new lead."""
        lead = Lead(**data)
        self.db.add(lead)
        await self.db.flush()
        await self.db.refresh(lead)
        return lead

    async def get_by_id(self, lead_id: UUID) -> Optional[Lead]:
        """Get a single lead with all relations."""
        result = await self.db.execute(
            select(Lead)
            .options(
                selectinload(Lead.contact_info),
                selectinload(Lead.website_analysis),
                selectinload(Lead.executive_info),
                selectinload(Lead.opportunity_insight),
                selectinload(Lead.notes),
                selectinload(Lead.tags),
                selectinload(Lead.contact_history),
                selectinload(Lead.search_job),
            )
            .where(Lead.id == lead_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
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
        tag_ids: Optional[List[UUID]] = None,
        user_id: Optional[UUID] = None,
    ) -> tuple[List[Lead], int]:
        """Get paginated leads with filtering and sorting."""
        query = select(Lead).options(
            selectinload(Lead.contact_info),
            selectinload(Lead.tags),
        )

        # Filters
        filters = []
        if user_id:
            from app.infrastructure.database.models import SearchJob
            query = query.join(SearchJob, Lead.search_job_id == SearchJob.id)
            filters.append(SearchJob.user_id == user_id)

        if search:
            filters.append(
                or_(
                    Lead.company_name.ilike(f"%{search}%"),
                    Lead.industry.ilike(f"%{search}%"),
                    Lead.city.ilike(f"%{search}%"),
                )
            )
        if status:
            filters.append(Lead.status == status)
        if industry:
            filters.append(Lead.industry.ilike(f"%{industry}%"))
        if country:
            filters.append(Lead.country.ilike(f"%{country}%"))
        if state:
            filters.append(Lead.state.ilike(f"%{state}%"))
        if city:
            filters.append(Lead.city.ilike(f"%{city}%"))
        if min_score is not None:
            filters.append(Lead.lead_score >= min_score)
        if max_score is not None:
            filters.append(Lead.lead_score <= max_score)

        if filters:
            query = query.where(*filters)

        # Count total
        count_query = select(func.count()).select_from(Lead)
        if user_id:
            from app.infrastructure.database.models import SearchJob
            count_query = count_query.join(SearchJob, Lead.search_job_id == SearchJob.id)
            
        if filters:
            count_query = count_query.where(*filters)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Sorting
        sort_column = getattr(Lead, sort_by, Lead.lead_score)
        if sort_dir == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Pagination
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        leads = result.scalars().all()

        return list(leads), total

    async def update(self, lead_id: UUID, data: Dict[str, Any]) -> Optional[Lead]:
        """Update a lead's fields."""
        await self.db.execute(
            update(Lead).where(Lead.id == lead_id).values(**data)
        )
        await self.db.flush()
        return await self.get_by_id(lead_id)

    async def delete(self, lead_id: UUID) -> bool:
        """Delete a lead."""
        lead = await self.db.get(Lead, lead_id)
        if not lead:
            return False
        await self.db.delete(lead)
        return True

    async def get_by_job_id(self, job_id: UUID) -> List[Lead]:
        """Get all leads from a search job."""
        result = await self.db.execute(
            select(Lead).where(Lead.search_job_id == job_id)
            .order_by(desc(Lead.lead_score))
        )
        return list(result.scalars().all())

    async def check_duplicate(self, company_name: str, city: str) -> bool:
        """Check if a lead already exists."""
        result = await self.db.execute(
            select(func.count()).select_from(Lead)
            .where(Lead.company_name.ilike(company_name))
            .where(Lead.city.ilike(city))
        )
        return result.scalar_one() > 0

    async def add_contact_info(self, lead_id: UUID, data: Dict[str, Any]) -> ContactInfo:
        """Add contact information to a lead."""
        contact = ContactInfo(lead_id=lead_id, **data)
        self.db.add(contact)
        await self.db.flush()
        return contact

    async def upsert_website_analysis(self, lead_id: UUID, data: Dict[str, Any]) -> WebsiteAnalysis:
        """Create or update website analysis for a lead."""
        result = await self.db.execute(
            select(WebsiteAnalysis).where(WebsiteAnalysis.lead_id == lead_id)
        )
        analysis = result.scalar_one_or_none()
        if analysis:
            for k, v in data.items():
                setattr(analysis, k, v)
        else:
            analysis = WebsiteAnalysis(lead_id=lead_id, **data)
            self.db.add(analysis)
        await self.db.flush()
        return analysis

    async def add_executive(self, lead_id: UUID, data: Dict[str, Any]) -> ExecutiveInfo:
        """Add executive information to a lead."""
        executive = ExecutiveInfo(lead_id=lead_id, **data)
        self.db.add(executive)
        await self.db.flush()
        return executive

    async def upsert_opportunity_insight(self, lead_id: UUID, data: Dict[str, Any]) -> OpportunityInsight:
        """Create or update opportunity insight for a lead."""
        result = await self.db.execute(
            select(OpportunityInsight).where(OpportunityInsight.lead_id == lead_id)
        )
        insight = result.scalar_one_or_none()
        if insight:
            for k, v in data.items():
                setattr(insight, k, v)
        else:
            insight = OpportunityInsight(lead_id=lead_id, **data)
            self.db.add(insight)
        await self.db.flush()
        return insight

    async def get_export_data(
        self,
        lead_ids: Optional[List[UUID]] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Lead]:
        """Get leads for export with all relations."""
        query = select(Lead).options(
            selectinload(Lead.contact_info),
            selectinload(Lead.website_analysis),
            selectinload(Lead.executive_info),
            selectinload(Lead.opportunity_insight),
            selectinload(Lead.tags),
        )
        if lead_ids:
            query = query.where(Lead.id.in_(lead_ids))
        query = query.order_by(desc(Lead.lead_score))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_analytics(self) -> Dict[str, Any]:
        """Get aggregate analytics data."""
        total = await self.db.execute(select(func.count()).select_from(Lead))
        avg_score = await self.db.execute(select(func.avg(Lead.lead_score)))
        contacted = await self.db.execute(
            select(func.count()).select_from(Lead)
            .where(Lead.status.in_([LeadStatus.CONTACTED, LeadStatus.INTERESTED, LeadStatus.MEETING_SCHEDULED]))
        )
        closed_won = await self.db.execute(
            select(func.count()).select_from(Lead).where(Lead.status == LeadStatus.CLOSED_WON)
        )

        # Top industries
        top_industries = await self.db.execute(
            select(Lead.industry, func.count(Lead.id).label("count"))
            .group_by(Lead.industry)
            .order_by(desc("count"))
            .limit(10)
        )

        # Top cities
        top_cities = await self.db.execute(
            select(Lead.city, func.count(Lead.id).label("count"))
            .group_by(Lead.city)
            .order_by(desc("count"))
            .limit(10)
        )

        return {
            "total_leads": total.scalar_one(),
            "avg_lead_score": round(avg_score.scalar_one() or 0, 1),
            "contacted_leads": contacted.scalar_one(),
            "closed_won": closed_won.scalar_one(),
            "top_industries": [
                {"name": r[0], "count": r[1]} for r in top_industries.all()
            ],
            "top_cities": [
                {"name": r[0], "count": r[1]} for r in top_cities.all()
            ],
        }
