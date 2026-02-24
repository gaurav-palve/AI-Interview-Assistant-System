# app/schemas/auth_schema.py
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Optional, Annotated

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
    first_name:  Annotated[str, Field(max_length=50,examples =["ajay"])]
    middle_name: Annotated[Optional[str], Field(default=None, description="Middle name is optional",examples =["Alan","ajay"])]
    last_name: str
    mobile_number: Annotated[int,Field(strict=True, examples=[9876543210], description="Mobile number must be a 10-digit integer")]
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
    role_name: str
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
