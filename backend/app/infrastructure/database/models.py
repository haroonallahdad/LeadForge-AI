"""
LeadForge AI — SQLAlchemy ORM Models
All database models with proper relationships, indexes, and constraints.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text,
    DateTime, ForeignKey, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func
import enum


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    RESEARCHING = "researching"
    CONTACTED = "contacted"
    FOLLOW_UP = "follow_up"
    INTERESTED = "interested"
    MEETING_SCHEDULED = "meeting_scheduled"
    PROPOSAL_SENT = "proposal_sent"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    REJECTED = "rejected"


class ExportFormat(str, enum.Enum):
    CSV = "csv"
    XLSX = "xlsx"


# ─────────────────────────────────────────────────────────────────────────────
# Association Tables
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Table

lead_tags = Table(
    "lead_tags",
    Base.metadata,
    Column("lead_id", UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE")),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE")),
)


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────

class User(Base):
    """Platform users — analysts, managers, admins."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active = Column(Boolean, default=False)  # False by default for admin approval
    is_verified = Column(Boolean, default=False)
    subscription_plan = Column(String(50), default="FREE") # FREE, SIMPLE, PREMIUM
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    webhook_url = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    search_jobs = relationship("SearchJob", back_populates="user")
    exports = relationship("ExportHistory", back_populates="user")
    contact_history = relationship("ContactHistory", back_populates="user")
    payment_proofs = relationship("PaymentProof", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"


class Industry(Base):
    """Industry categories — 100+ built-in + custom."""
    __tablename__ = "industries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(255), nullable=True)  # e.g., "Healthcare", "Construction"
    aliases = Column(JSON, default=list)  # alternative search terms
    is_custom = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    icon = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    search_jobs = relationship("SearchJob", back_populates="industry")

    def __repr__(self):
        return f"<Industry {self.name}>"


class SearchJob(Base):
    """Background search jobs — tracks progress of lead discovery."""
    __tablename__ = "search_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    industry_id = Column(UUID(as_uuid=True), ForeignKey("industries.id"), nullable=True)

    # Location
    industry_name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    lead_count = Column(Integer, default=50)

    # Status
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    progress = Column(Integer, default=0)  # 0-100%
    current_step = Column(String(255), nullable=True)

    # Results
    total_found = Column(Integer, default=0)
    total_crawled = Column(Integer, default=0)
    total_scored = Column(Integer, default=0)

    # Metadata
    celery_task_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    logs = Column(JSON, default=list)  # list of log messages

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="search_jobs")
    industry = relationship("Industry", back_populates="search_jobs")
    leads = relationship("Lead", back_populates="search_job")

    def __repr__(self):
        return f"<SearchJob {self.industry_name} in {self.city}, {self.country} [{self.status}]>"


class Lead(Base):
    """Core lead entity — represents a potential B2B client."""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    search_job_id = Column(UUID(as_uuid=True), ForeignKey("search_jobs.id"), nullable=True)

    # Company Info
    company_name = Column(String(500), nullable=False)
    industry = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # Location
    country = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    zip_code = Column(String(20), nullable=True)

    # Online Presence
    website = Column(String(500), nullable=True)
    website_discovered = Column(Boolean, default=False)  # found via discovery

    # Reviews
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    source = Column(String(100), nullable=True)  # google_maps, yelp, mock, etc.
    source_id = Column(String(255), nullable=True)  # external ID from source

    # Scoring
    website_score = Column(Integer, default=0)  # 0-100
    lead_score = Column(Integer, default=0)     # 0-500

    # CRM
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)

    # Metadata
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    search_job = relationship("SearchJob", back_populates="leads")
    contact_info = relationship("ContactInfo", back_populates="lead", cascade="all, delete-orphan")
    website_analysis = relationship("WebsiteAnalysis", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    executive_info = relationship("ExecutiveInfo", back_populates="lead", cascade="all, delete-orphan")
    opportunity_insight = relationship("OpportunityInsight", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="lead", cascade="all, delete-orphan")
    contact_history = relationship("ContactHistory", back_populates="lead", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=lead_tags, back_populates="leads")

    __table_args__ = (
        Index("ix_leads_lead_score", "lead_score"),
        Index("ix_leads_status", "status"),
        Index("ix_leads_country_state_city", "country", "state", "city"),
        Index("ix_leads_industry", "industry"),
    )

    def __repr__(self):
        return f"<Lead {self.company_name} [{self.lead_score}]>"


class ContactInfo(Base):
    """Contact details extracted from websites and business listings."""
    __tablename__ = "contact_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)

    # Contact
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    # Social Media
    facebook_url = Column(String(500), nullable=True)
    instagram_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    twitter_url = Column(String(500), nullable=True)
    youtube_url = Column(String(500), nullable=True)

    # Meta
    source = Column(String(100), nullable=True)  # website, google, yelp
    crawled_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="contact_info")

    def __repr__(self):
        return f"<ContactInfo {self.email or self.phone}>"


class WebsiteAnalysis(Base):
    """Website quality analysis and scoring."""
    __tablename__ = "website_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Checks
    website_exists = Column(Boolean, default=False)
    ssl_enabled = Column(Boolean, default=False)
    mobile_responsive = Column(Boolean, default=False)
    has_contact_form = Column(Boolean, default=False)
    has_cta_button = Column(Boolean, default=False)
    has_booking_system = Column(Boolean, default=False)
    has_blog = Column(Boolean, default=False)
    has_social_links = Column(Boolean, default=False)
    has_google_maps = Column(Boolean, default=False)
    has_seo_title = Column(Boolean, default=False)
    has_seo_description = Column(Boolean, default=False)

    # Scores (0-100)
    speed_score = Column(Integer, default=0)
    seo_score = Column(Integer, default=0)
    design_score = Column(Integer, default=0)
    website_score = Column(Integer, default=0)

    # Details
    page_title = Column(String(500), nullable=True)
    meta_description = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)    # detected technologies
    improvement_summary = Column(Text, nullable=True)

    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="website_analysis")

    def __repr__(self):
        return f"<WebsiteAnalysis score={self.website_score}>"


class ExecutiveInfo(Base):
    """Key executives discovered for the company."""
    __tablename__ = "executive_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)

    executive_name = Column(String(255), nullable=False)
    position = Column(String(255), nullable=True)  # CEO, Founder, Owner
    linkedin_profile = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)

    discovered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="executive_info")

    def __repr__(self):
        return f"<Executive {self.executive_name} ({self.position})>"


class OpportunityInsight(Base):
    """AI-generated and manual opportunity notes."""
    __tablename__ = "opportunity_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False)

    ai_notes = Column(Text, nullable=True)      # generated opportunity analysis
    manual_notes = Column(Text, nullable=True)  # user-added notes
    recommended_services = Column(JSON, default=list)  # list of service names

    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="opportunity_insight")


class Note(Base):
    """User-written notes on a lead."""
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="notes")

    def __repr__(self):
        return f"<Note {self.id}>"


class Tag(Base):
    """Labels for organizing leads."""
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(20), default="#6366f1")

    # Relationships
    leads = relationship("Lead", secondary=lead_tags, back_populates="tags")

    def __repr__(self):
        return f"<Tag {self.name}>"


class ContactHistory(Base):
    """History of interactions with a lead."""
    __tablename__ = "contact_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    action = Column(String(255), nullable=False)  # e.g., "Email sent", "Called", "Meeting booked"
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="contact_history")
    user = relationship("User", back_populates="contact_history")

    def __repr__(self):
        return f"<ContactHistory {self.action}>"


class ExportHistory(Base):
    """Record of every export action."""
    __tablename__ = "export_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    format = Column(Enum(ExportFormat), nullable=False)
    row_count = Column(Integer, default=0)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    filters_applied = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="exports")

    def __repr__(self):
        return f"<ExportHistory {self.format} {self.row_count} rows>"


class AppLog(Base):
    """System-level application logs."""
    __tablename__ = "app_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    module = Column(String(255), nullable=True)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AppLog [{self.level}] {self.message[:50]}>"


class PaymentProof(Base):
    """Manual payment screenshots uploaded by users."""
    __tablename__ = "payment_proofs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_requested = Column(String(50), nullable=False)  # SIMPLE or PREMIUM
    proof_image_base64 = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="payment_proofs")

    def __repr__(self):
        return f"<PaymentProof {self.plan_requested} by {self.user_id}>"
