"""
LeadForge AI — FastAPI Dependency Injection
Common dependencies for authentication and database access.
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.job_repository import UserRepository
from app.application.services.auth_service import decode_access_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Extract and validate JWT, return the current user."""
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    # Auto-downgrade check
    if user.subscription_end_date:
        from datetime import datetime, timezone
        if datetime.now(timezone.utc) > user.subscription_end_date.replace(tzinfo=timezone.utc):
            user.subscription_plan = "FREE"
            user.subscription_end_date = None
            await db.commit()

    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
