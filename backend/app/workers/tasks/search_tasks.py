"""
LeadForge AI — Search Pipeline Tasks
The full pipeline: Search → Crawl → Score → Insights

This is the core Celery task that orchestrates the entire lead
discovery workflow for a search job.
"""
import asyncio
import logging
from uuid import UUID
from datetime import datetime

from app.workers.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in Celery sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    name="app.workers.tasks.search_tasks.run_search_pipeline",
    max_retries=2,
    default_retry_delay=60,
)
def run_search_pipeline(self, job_id: str):
    """
    Full pipeline for a single search job.
    Steps:
      1. Search companies (adapter)
      2. Discover missing websites
      3. Crawl websites for contacts
      4. Score each lead
      5. Generate opportunity insights
      6. Mark job complete
    """
    run_async(_run_pipeline_async(self, job_id))


async def _run_pipeline_async(task_or_job_id, job_id: str = None):
    """
    Async implementation of the full pipeline.
    Can be called:
     - from Celery: _run_pipeline_async(celery_task, job_id)
     - from BackgroundTasks: _run_pipeline_async(job_id)  [no task obj]
    """
    # Support being called as a plain background task with just job_id
    if job_id is None:
        job_id = task_or_job_id
        task_obj = None
    else:
        task_obj = task_or_job_id

    class _FakeTask:
        class request:
            id = "local"

    if task_obj is None:
        task_obj = _FakeTask()
    from app.infrastructure.database.session import AsyncSessionLocal
    from app.infrastructure.repositories.job_repository import SearchJobRepository, IndustryRepository
    from app.infrastructure.repositories.lead_repository import LeadRepository
    from app.infrastructure.adapters.mock_adapter import get_adapter
    from app.infrastructure.crawlers.website_crawler import SimpleCrawler
    from app.application.services.scoring_service import (
        calculate_lead_score, calculate_website_score, ScoringInput
    )

    async with AsyncSessionLocal() as db:
        job_repo = SearchJobRepository(db)
        lead_repo = LeadRepository(db)

        try:
            # ── Mark started ───────────────────────────────────────────────────
            await job_repo.mark_started(UUID(job_id), getattr(getattr(task_obj, 'request', None), 'id', 'local') or 'local')
            await job_repo.append_log(UUID(job_id), "Pipeline started")
            await db.commit()

            job = await job_repo.get_by_id(UUID(job_id))
            if not job:
                logger.error(f"Job {job_id} not found")
                return

            total_requested = job.lead_count
            industry = job.industry_name
            city = job.city
            state = job.state
            country = job.country

            # ── Step 1: Search companies ───────────────────────────────────────
            await job_repo.update_progress(UUID(job_id), 10, "Searching for companies...")
            await db.commit()
            await job_repo.append_log(UUID(job_id), f"Searching {industry} in {city}, {country}")
            await db.commit()

            adapter = get_adapter(settings)
            companies = await adapter.search_companies(
                industry=industry,
                city=city,
                state=state,
                country=country,
                limit=total_requested,
            )

            await job_repo.update_progress(UUID(job_id), 20, f"Found {len(companies)} companies", total_found=len(companies))
            await db.commit()
            await job_repo.append_log(UUID(job_id), f"Found {len(companies)} companies via {adapter.source_name}")
            await db.commit()

            # ── Step 2: Save companies as leads ────────────────────────────────
            leads_created = []
            for i, company in enumerate(companies):
                # Deduplication check
                is_dup = await lead_repo.check_duplicate(company.company_name, company.city or "")
                lead = await lead_repo.create({
                    "search_job_id": UUID(job_id),
                    "company_name": company.company_name,
                    "industry": company.industry or industry,
                    "country": company.country or country,
                    "state": company.state or state,
                    "city": company.city or city,
                    "address": company.address,
                    "website": company.website,
                    "rating": company.rating,
                    "review_count": company.review_count,
                    "source": company.source,
                    "source_id": company.source_id,
                    "is_duplicate": is_dup,
                })

                # Add phone as contact info
                if company.phone:
                    await lead_repo.add_contact_info(lead.id, {
                        "phone": company.phone,
                        "source": company.source,
                    })

                leads_created.append(lead)

            await db.commit()

            progress_per_lead = 60 / max(len(leads_created), 1)
            current_progress = 20

            # ── Step 3: Crawl websites and score ───────────────────────────────
            crawler = SimpleCrawler(timeout=settings.request_timeout_seconds)

            for idx, lead in enumerate(leads_created):
                try:
                    current_progress = int(20 + (idx + 1) * progress_per_lead)
                    await job_repo.update_progress(
                        UUID(job_id),
                        current_progress,
                        f"Crawling ({idx + 1}/{len(leads_created)}): {lead.company_name}",
                        total_crawled=idx + 1,
                    )
                    await db.commit()

                    crawl_data = {}
                    website_score = 0

                    if lead.website:
                        # Crawl the website
                        crawl_result = await crawler.crawl(lead.website)
                        crawl_data = crawl_result.to_dict()

                        # Save contact info from crawl
                        has_social = any([
                            crawl_result.facebook_url, crawl_result.instagram_url,
                            crawl_result.linkedin_url, crawl_result.twitter_url,
                            crawl_result.youtube_url
                        ])

                        if crawl_result.emails or crawl_result.phones or has_social:
                            for email in crawl_result.emails[:3]:
                                await lead_repo.add_contact_info(lead.id, {
                                    "email": email,
                                    "source": "website_crawl",
                                })
                            
                            if crawl_result.phones or has_social:
                                await lead_repo.add_contact_info(lead.id, {
                                    "phone": crawl_result.phones[0] if crawl_result.phones else None,
                                    "source": "website_crawl",
                                    "facebook_url": crawl_result.facebook_url,
                                    "instagram_url": crawl_result.instagram_url,
                                    "linkedin_url": crawl_result.linkedin_url,
                                    "twitter_url": crawl_result.twitter_url,
                                    "youtube_url": crawl_result.youtube_url,
                                })

                        website_score = calculate_website_score(crawl_data)

                        # Save website analysis
                        await lead_repo.upsert_website_analysis(lead.id, {
                            "website_exists": True,
                            "ssl_enabled": crawl_result.ssl_enabled,
                            "mobile_responsive": False,  # basic detection
                            "has_contact_form": crawl_result.has_contact_form,
                            "has_cta_button": crawl_result.has_cta_button,
                            "has_social_links": crawl_result.has_social_links,
                            "has_seo_title": bool(crawl_result.page_title),
                            "has_seo_description": bool(crawl_result.meta_description),
                            "website_score": website_score,
                            "page_title": crawl_result.page_title,
                            "meta_description": crawl_result.meta_description,
                        })

                    else:
                        # No website — record that
                        await lead_repo.upsert_website_analysis(lead.id, {
                            "website_exists": False,
                            "website_score": 0,
                        })

                    # ── Step 4: Calculate lead score ──────────────────────────
                    scoring_input = ScoringInput(
                        has_website=bool(lead.website),
                        website_score=website_score,
                        ssl_enabled=crawl_data.get("ssl_enabled", False),
                        has_contact_form=crawl_data.get("has_contact_form", False),
                        has_cta=crawl_data.get("has_cta_button", False),
                        has_seo_title=crawl_data.get("page_title") is not None,
                        has_seo_description=crawl_data.get("meta_description") is not None,
                        rating=lead.rating,
                        review_count=lead.review_count,
                        has_facebook=bool(crawl_data.get("facebook_url")),
                        has_instagram=bool(crawl_data.get("instagram_url")),
                        has_linkedin=bool(crawl_data.get("linkedin_url")),
                        has_twitter=bool(crawl_data.get("twitter_url")),
                    )
                    score_result = calculate_lead_score(scoring_input)

                    # Update lead with scores
                    from sqlalchemy import update
                    from app.infrastructure.database.models import Lead as LeadModel
                    await db.execute(
                        update(LeadModel)
                        .where(LeadModel.id == lead.id)
                        .values(lead_score=score_result.total_score, website_score=website_score)
                    )

                    # Save website analysis improvement summary
                    if lead.website:
                        improvement = ". ".join(score_result.improvement_suggestions[:4])
                        await lead_repo.upsert_website_analysis(lead.id, {
                            "improvement_summary": improvement,
                        })

                    # ── Step 5: Generate opportunity insight ──────────────────
                    await lead_repo.upsert_opportunity_insight(lead.id, {
                        "ai_notes": score_result.opportunity_notes,
                        "recommended_services": score_result.recommended_services,
                    })

                    await db.commit()

                except Exception as e:
                    logger.error(f"Error processing lead {lead.company_name}: {e}")
                    await db.rollback()
                    continue

            # ── Step 6: Mark job completed ─────────────────────────────────────
            await job_repo.mark_completed(UUID(job_id), {
                "total_found": len(companies),
                "total_crawled": len(leads_created),
                "total_scored": len(leads_created),
            })
            await job_repo.append_log(UUID(job_id), f"Completed — {len(leads_created)} leads processed")
            await db.commit()

            logger.info(f"Job {job_id} completed: {len(leads_created)} leads")

        except Exception as e:
            logger.error(f"Pipeline failed for job {job_id}: {e}", exc_info=True)
            try:
                await job_repo.mark_failed(UUID(job_id), str(e))
                await db.commit()
            except Exception:
                pass
            raise
