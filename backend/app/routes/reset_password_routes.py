from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.database import get_database, OTP_COLLECTION, USERS_COLLECTION
from app.database import update_admin_password
from app.utils.validate_password_strength import validate_password_strength
from app.utils.auth_dependency import get_current_user
from app.utils import otp_verification
router = APIRouter()
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: int
    new_password: str
    confirm_password: str

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest,
                         current_user: dict = Depends(get_current_user)):
    db = get_database()
    await otp_verification.verify_otp(db, request.email, request.otp, OTP_COLLECTION)
    
    await update_admin_password(request.email, request.new_password)

    db[OTP_COLLECTION].delete_one({"email": request.email})  # cleanup

    return {"message": "Password reset successful"}
