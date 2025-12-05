from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
import random
from pydantic import BaseModel, EmailStr
from app.database import AUTH_COLLECTION, OTP_COLLECTION, get_database
from app.services.email_service import EmailService
from app.utils.auth_dependency import require_auth
router = APIRouter()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest,
                          ):
    db = get_database()
    user = await db[AUTH_COLLECTION].find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = random.randint(100000, 999999)
    expiry = datetime.utcnow() + timedelta(minutes=5)

    db[OTP_COLLECTION].update_one(
        {"email": request.email},
        {"$set": {"type":"forget_password","otp": int(otp), "expires_at": expiry}},
        upsert=True
    )

    emailobject = EmailService()
    await emailobject.send_forget_password_otp_email(request.email, otp)
    return {"message": "OTP sent successfully to your email"}
