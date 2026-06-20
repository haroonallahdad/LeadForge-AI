"""
LeadForge AI — Auth API Routes
Register, login, profile endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.job_repository import UserRepository
from app.infrastructure.database.models import PaymentProof, User
from app.application.services.auth_service import hash_password, verify_password, create_access_token, create_verification_token
from app.infrastructure.services.email_service import send_verification_email, send_password_reset_email
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    existing = await user_repo.get_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    is_root = data.email.lower() == "haroonallahdad@outlook.com"
    user = await user_repo.create({
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "full_name": data.full_name,
        "role": "admin" if is_root else "analyst",
        "is_active": True if is_root else False,
        "is_verified": True if is_root else False,
        "subscription_plan": "PREMIUM" if is_root else "FREE",
    })
    await db.commit()

    if is_root:
        token = create_access_token(str(user.id), user.email, user.role.value)
        return {
            "access_token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
            }
        }
    
    # Use long-lived verification token (7 days) so server restarts don't invalidate it
    verify_token = create_verification_token(str(user.id), user.email, "verify", expire_minutes=60 * 24 * 7)
    background_tasks.add_task(send_verification_email, user.email, verify_token)
    
    return {"status": "pending_verification", "message": "Verification email sent! Please check your inbox and spam folder."}


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        if not user.is_verified:
            raise HTTPException(status_code=401, detail="Please verify your email before logging in.")
        raise HTTPException(status_code=401, detail="Account pending admin approval")

    token = create_access_token(str(user.id), user.email, user.role.value)
    return {
        "access_token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
        }
    }


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "subscription_plan": current_user.subscription_plan,
        "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }

@router.delete("/me", status_code=200)
async def delete_current_user(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.delete(current_user)
    await db.commit()
    return {"status": "success", "message": "Account deleted successfully"}


class PaymentUploadRequest(BaseModel):
    plan_requested: str
    proof_image_base64: str

@router.post("/payments/upload", status_code=201)
async def upload_payment_proof(
    data: PaymentUploadRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    proof = PaymentProof(
        user_id=current_user.id,
        plan_requested=data.plan_requested,
        proof_image_base64=data.proof_image_base64,
        status="PENDING"
    )
    db.add(proof)
    await db.commit()
    return {"status": "uploaded"}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password", status_code=200)
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(data.email)
    
    if user:
        reset_token = create_verification_token(str(user.id), user.email, "reset", expire_minutes=60)
        background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    
    return {
        "status": "success", 
        "message": "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder."
    }

class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/verify-email", status_code=200)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    from app.application.services.auth_service import decode_access_token
    
    try:
        payload = decode_access_token(data.token)
    except Exception:
        payload = None
        
    if not payload or payload.get("role") != "verify":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token. Please register again.")
    
    user_id = payload.get("sub")
    
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = True
    user.is_active = True
    await db.commit()
    
    return {"status": "success", "message": "Email verified successfully! You can now log in."}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password", status_code=200)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    from app.application.services.auth_service import decode_access_token
    
    try:
        payload = decode_access_token(data.token)
    except Exception:
        payload = None
        
    if not payload or payload.get("role") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")
    
    user_id = payload.get("sub")
    
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = hash_password(data.new_password)
    await db.commit()
    
    return {"status": "success", "message": "Password reset successfully! You can now log in with your new password."}
