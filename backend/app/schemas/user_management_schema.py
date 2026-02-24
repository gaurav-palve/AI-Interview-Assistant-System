from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re

PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")  # India mobile

class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    middle_name: Optional[str] = Field(None, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., description="10 digit Indian mobile number")
    hashed_password: str = Field(..., min_length=8)
    role_id: str
    assignable_role_ids: list[str] = []
    employee_id: str    
    department: str
    location: str
    reporting_manager: str

     # ---------- Validators ----------

    @field_validator("first_name", "middle_name", "last_name")
    def validate_name(cls, value):
        
        if not isinstance(value, str):
            return None

        if not value.isalpha():
            return None

        return value.title()


    @field_validator("phone")
    def validate_phone(cls, value):
        if not PHONE_REGEX.match(value):
            raise ValueError("Invalid phone number")
        return value

    @field_validator("department", "location")
    def validate_non_empty_text(cls, value):
        if not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    middle_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = None
    hashed_password: Optional[str] = Field(None, min_length=8)
    role_id: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    reporting_manager: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("first_name", "middle_name", "last_name")
    def validate_name(cls, value):
        
        if not isinstance(value, str):
            return None

        if not value.isalpha():
            return None

        return value.title()

    @field_validator("phone")
    def validate_phone(cls, value):
        if value and not PHONE_REGEX.match(value):
            raise ValueError("Invalid phone number")
        return value