from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.database import get_database, OTP_COLLECTION, AUTH_COLLECTION
from app.database import update_admin_password
from app.utils.validate_password_strength import validate_password_strength
from app.utils.auth_dependency import require_auth

router = APIRouter()
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: int
    new_password: str
    confirm_password: str

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest,
                         current_user: dict = Depends(require_auth)):
    db = get_database()
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    record = await db[OTP_COLLECTION].find_one({"email": request.email})
    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if record["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    
    await update_admin_password(request.email, request.new_password)

    db[OTP_COLLECTION].delete_one({"email": request.email})  # cleanup

    return {"message": "Password reset successful"}
