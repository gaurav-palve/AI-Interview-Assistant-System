# app/schemas/auth_schema.py
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional

class UserSignupRequest(BaseModel):
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
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    mobile_number: str
    email: EmailStr
    password: str
    confirm_password: str

class UserSignupResponse(BaseModel):
    message: str
    user_id: str
class UserSigninRequest(BaseModel):
    email: EmailStr
    password: str
    device_info: Optional[Dict] = None

class UserSigninResponse(BaseModel):
    user_name: str
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
