# app/schemas/auth_schema.py
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional

class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
class EmailRequest(BaseModel):
    email: EmailStr

class OTPResponse(BaseModel):
    message: str
class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: int

class CreateAccountRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class AdminSignupResponse(BaseModel):
    message: str
    admin_id: str
class AdminSigninRequest(BaseModel):
    email: EmailStr
    password: str
    device_info: Optional[Dict] = None

class AdminSigninResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None  # Optional to support both cookie and response body
    message: str = "Login successful"

class RefreshRequest(BaseModel):
    refresh_token: str = None
    device_info: Optional[Dict] = None

    
class RefreshResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str = None
    
class LogoutRequest(BaseModel):
    refresh_token: str = None
