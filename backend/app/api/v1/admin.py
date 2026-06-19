"""
LeadForge AI — Admin API Routes
Endpoints for managing users and approving payment proofs.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

from app.infrastructure.database.session import get_db
from app.infrastructure.database.models import User, PaymentProof, UserRole
from app.api.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# ─────────────────────────────────────────────────────────────────────────────
# Dependencies
# ─────────────────────────────────────────────────────────────────────────────

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    subscription_plan: str

class PaymentProofResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    plan_requested: str
    status: str
    uploaded_at: str

# ─────────────────────────────────────────────────────────────────────────────
# User Management
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "subscription_plan": u.subscription_plan
        }
        for u in users
    ]

@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    user.is_verified = True
    await db.commit()
    return {"status": "approved", "user_email": user.email}


# ─────────────────────────────────────────────────────────────────────────────
# Payment Proofs
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/payments", response_model=List[PaymentProofResponse])
async def list_payments(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Fetch payments with associated users
    # In async sqlalchemy, we typically use selectinload or joinedload, 
    # but for simplicity we can just execute and map.
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(PaymentProof)
        .options(selectinload(PaymentProof.user))
        .order_by(PaymentProof.uploaded_at.desc())
    )
    proofs = result.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "user_id": str(p.user_id),
            "user_email": p.user.email if p.user else "Unknown",
            "plan_requested": p.plan_requested,
            "status": p.status,
            "uploaded_at": p.uploaded_at.isoformat() if p.uploaded_at else ""
        }
        for p in proofs
    ]

@router.get("/payments/{proof_id}/image")
async def get_payment_image(
    proof_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(PaymentProof).where(PaymentProof.id == proof_id))
    proof = result.scalars().first()
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    return {"image_base64": proof.proof_image_base64}

@router.post("/payments/{proof_id}/approve")
async def approve_payment(
    proof_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(PaymentProof)
        .options(selectinload(PaymentProof.user))
        .where(PaymentProof.id == proof_id)
    )
    proof = result.scalars().first()
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    proof.status = "APPROVED"
    if proof.user:
        from datetime import datetime, timedelta, timezone
        proof.user.subscription_plan = proof.plan_requested
        proof.user.subscription_end_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    await db.commit()
    return {"status": "approved", "plan": proof.plan_requested}

@router.post("/payments/{proof_id}/reject")
async def reject_payment(
    proof_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(PaymentProof).where(PaymentProof.id == proof_id))
    proof = result.scalars().first()
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    proof.status = "REJECTED"
    await db.commit()
    return {"status": "rejected"}
