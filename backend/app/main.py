"""
LeadForge AI — FastAPI Application Entry Point
Wires together all routers, middleware, and startup logic.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.infrastructure.database.session import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.search import router as search_router
from app.api.v1.leads import router as leads_router
from app.api.v1.misc import (
    export_router, analytics_router, industries_router, email_router
)

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("leadforge")


# ─────────────────────────────────────────────────────────────────────────────
# Rate Limiter
# ─────────────────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan (startup/shutdown)
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    logger.info("LeadForge AI starting up...")
    await init_db()
    logger.info("Database initialized")

    # Seed industries on first run
    await _seed_industries_if_empty()
    await _seed_root_users()
    logger.info("LeadForge AI ready")
    yield
    logger.info("LeadForge AI shutting down")


# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LeadForge AI",
    description="B2B Lead Intelligence Platform for Tech Harbor",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(search_router, prefix=API_PREFIX)
app.include_router(leads_router, prefix=API_PREFIX)
app.include_router(export_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(industries_router, prefix=API_PREFIX)
app.include_router(email_router, prefix=API_PREFIX)


# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.app_name, "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Industry Seeding
# ─────────────────────────────────────────────────────────────────────────────
async def _seed_industries_if_empty():
    """Seed 100+ industries on first startup."""
    from sqlalchemy import select, func
    from app.infrastructure.database.session import AsyncSessionLocal
    from app.infrastructure.database.models import Industry

    async with AsyncSessionLocal() as db:
        count_result = await db.execute(select(func.count()).select_from(Industry))
        count = count_result.scalar_one()
        if count > 0:
            return

        industries = [
            # Healthcare
            ("Dental Clinics", "Healthcare"), ("Medical Clinics", "Healthcare"),
            ("Optometry Clinics", "Healthcare"), ("Chiropractic Clinics", "Healthcare"),
            ("Physical Therapy Centers", "Healthcare"), ("Veterinary Clinics", "Healthcare"),
            ("Mental Health Clinics", "Healthcare"), ("Urgent Care Centers", "Healthcare"),
            ("Dermatology Clinics", "Healthcare"), ("Orthopedic Clinics", "Healthcare"),
            ("Pediatric Clinics", "Healthcare"), ("Plastic Surgery Clinics", "Healthcare"),

            # Legal
            ("Law Firms", "Legal"), ("Criminal Defense Attorneys", "Legal"),
            ("Personal Injury Attorneys", "Legal"), ("Family Law Firms", "Legal"),
            ("Immigration Attorneys", "Legal"), ("Real Estate Attorneys", "Legal"),
            ("Business Law Firms", "Legal"), ("Divorce Attorneys", "Legal"),

            # Construction & Home Services
            ("Roofing Companies", "Construction"), ("HVAC Contractors", "Construction"),
            ("Plumbing Services", "Construction"), ("Construction Companies", "Construction"),
            ("Electrical Contractors", "Construction"), ("Landscaping Companies", "Construction"),
            ("Painting Companies", "Construction"), ("Flooring Companies", "Construction"),
            ("Window & Door Companies", "Construction"), ("Kitchen Remodeling", "Construction"),
            ("Bathroom Remodeling", "Construction"), ("General Contractors", "Construction"),
            ("Concrete Contractors", "Construction"), ("Pool Companies", "Construction"),
            ("Pest Control Services", "Construction"), ("Fence Companies", "Construction"),
            ("Cleaning Companies", "Home Services"), ("Maid Services", "Home Services"),
            ("Moving Companies", "Home Services"), ("Storage Facilities", "Home Services"),

            # Real Estate
            ("Real Estate Agencies", "Real Estate"), ("Property Management Companies", "Real Estate"),
            ("Commercial Real Estate", "Real Estate"), ("Mortgage Brokers", "Real Estate"),

            # Financial
            ("Accounting Firms", "Financial"), ("Tax Services", "Financial"),
            ("Financial Advisors", "Financial"), ("Insurance Agencies", "Financial"),
            ("Bookkeeping Services", "Financial"), ("Payroll Services", "Financial"),
            ("Credit Repair Services", "Financial"), ("Wealth Management Firms", "Financial"),

            # Automotive
            ("Car Dealerships", "Automotive"), ("Auto Repair Shops", "Automotive"),
            ("Auto Body Shops", "Automotive"), ("Car Wash Services", "Automotive"),
            ("Auto Detailing Services", "Automotive"), ("Tire Shops", "Automotive"),
            ("Towing Services", "Automotive"),

            # Food & Hospitality
            ("Restaurants", "Food & Hospitality"), ("Cafes & Coffee Shops", "Food & Hospitality"),
            ("Hotels", "Food & Hospitality"), ("Catering Services", "Food & Hospitality"),
            ("Bakeries", "Food & Hospitality"), ("Food Trucks", "Food & Hospitality"),
            ("Event Venues", "Food & Hospitality"), ("Wedding Planners", "Food & Hospitality"),

            # Beauty & Wellness
            ("Salons", "Beauty & Wellness"), ("Barbershops", "Beauty & Wellness"),
            ("Spas", "Beauty & Wellness"), ("Gyms", "Beauty & Wellness"),
            ("Yoga Studios", "Beauty & Wellness"), ("Pilates Studios", "Beauty & Wellness"),
            ("Tattoo & Piercing Studios", "Beauty & Wellness"), ("Nail Salons", "Beauty & Wellness"),
            ("Massage Therapy Centers", "Beauty & Wellness"),

            # Retail
            ("Furniture Stores", "Retail"), ("Clothing Stores", "Retail"),
            ("Jewelry Stores", "Retail"), ("Electronics Stores", "Retail"),
            ("Sporting Goods Stores", "Retail"), ("Bookstores", "Retail"),
            ("Pet Stores", "Retail"), ("Toy Stores", "Retail"),
            ("Home Improvement Stores", "Retail"), ("Grocery Stores", "Retail"),

            # Education
            ("Tutoring Centers", "Education"), ("Daycare Centers", "Education"),
            ("Private Schools", "Education"), ("Dance Studios", "Education"),
            ("Music Schools", "Education"), ("Martial Arts Studios", "Education"),
            ("Driving Schools", "Education"), ("Language Schools", "Education"),

            # Manufacturing & Industrial
            ("Manufacturing Companies", "Industrial"), ("Warehousing & Logistics", "Industrial"),
            ("Printing Companies", "Industrial"), ("Metal Fabrication", "Industrial"),
            ("Packaging Companies", "Industrial"),

            # Professional Services
            ("Marketing Agencies", "Professional Services"), ("Staffing Agencies", "Professional Services"),
            ("IT Consulting Firms", "Professional Services"), ("Engineering Firms", "Professional Services"),
            ("Architecture Firms", "Professional Services"), ("Photography Studios", "Professional Services"),
            ("Videography Studios", "Professional Services"), ("Funeral Homes", "Professional Services"),
        ]

        for name, category in industries:
            industry = Industry(name=name, category=category, aliases=[], is_custom=False)
            db.add(industry)

        await db.commit()
        logger.info(f"Seeded {len(industries)} industries")


async def _seed_root_users():
    """Seed root users if they don't exist."""
    from sqlalchemy import select
    from app.infrastructure.database.session import AsyncSessionLocal
    from app.infrastructure.database.models import User
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    root_users = [
        {"email": "haroonallahdad@outlook.com", "password": "Haroon_15", "name": "Haroon"},
        {"email": "muhammadalijoya@gmail.com", "password": "Muhammadli_1234", "name": "Muhammad Ali"}
    ]

    async with AsyncSessionLocal() as db:
        for u in root_users:
            user = await db.execute(select(User).where(User.email == u["email"]))
            if not user.scalar_one_or_none():
                new_user = User(
                    email=u["email"],
                    hashed_password=pwd_context.hash(u["password"]),
                    full_name=u["name"],
                )
                db.add(new_user)
        
        await db.commit()
        logger.info("Seeded root users")
