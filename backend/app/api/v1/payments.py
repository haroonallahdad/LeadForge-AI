"""
LeadForge AI — Payments API Routes
Handles payment proof uploads from clients.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.infrastructure.database.session import get_db
from app.infrastructure.database.models import PaymentProof
from app.api.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentUploadRequest(BaseModel):
    plan_requested: str
    proof_image_base64: str


@router.post("/upload", status_code=201)
async def upload_payment_proof(
    data: PaymentUploadRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a screenshot as proof of payment for a plan upgrade."""
    
    # Simple validation
    if not data.proof_image_base64.startswith("data:image"):
        raise HTTPException(status_code=400, detail="Invalid image format. Must be base64 data URI.")
        
    proof = PaymentProof(
        user_id=current_user.id,
        plan_requested=data.plan_requested,
        proof_image_base64=data.proof_image_base64,
        status="PENDING"
    )
    db.add(proof)
    await db.commit()
    
    return {"message": "Payment proof uploaded successfully", "status": "PENDING"}
