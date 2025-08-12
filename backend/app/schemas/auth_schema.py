# app/schemas/auth_schema.py
from pydantic import BaseModel, EmailStr

class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str

class AdminSignupResponse(BaseModel):
    message: str
    admin_id: str

class AdminSigninRequest(BaseModel):
    email: EmailStr
    password: str

class AdminSigninResponse(BaseModel):
    access_token: str
    token_type: str = "session"
    message: str = "Login successful"

class LogoutRequest(BaseModel):
    token: str
