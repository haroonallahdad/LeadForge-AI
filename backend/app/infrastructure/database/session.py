"""
LeadForge AI — Database Session Management
Async SQLAlchemy session factory for FastAPI dependency injection.
Supports both SQLite (local dev) and PostgreSQL (production).
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

# Async engine for FastAPI / application code
async_engine = create_async_engine(
    settings.database_url,
    echo=settings.app_debug,
    # SQLite doesn't support connection pooling params
    **({} if _is_sqlite else {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }),
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.sync_database_url,
    echo=False,
    connect_args={"check_same_thread": False} if _is_sqlite else {"pool_pre_ping": True},
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (used in development / testing)."""
    from app.infrastructure.database.models import Base
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Add subscription_end_date column safely to existing tables
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;"))
        except Exception:
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_end_date DATETIME;"))
            except Exception:
                pass

