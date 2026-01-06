from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, timezone
import re
from app.services.user_management_service import UserService
from app.utils.logger import get_logger
from app.utils.auth_dependency import get_current_user, require_permission
from bson import ObjectId

logger = get_logger(__name__)

router = APIRouter(
    tags=["Users"]
)

NAME_REGEX = re.compile(r"^[A-Za-z][A-Za-z\s'-]{1,49}$")
PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")  # India mobile

class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    middle_name: Optional[str] = Field(None, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., description="10 digit Indian mobile number")
    hashed_password: str = Field(..., min_length=8)
    role_id: str
    employee_id: str
    department: str
    location: str
    reporting_manager: str

    # ---------- Validators ----------

    @validator("first_name", "middle_name", "last_name")
    def validate_name(cls, value):
        if value and not NAME_REGEX.match(value.strip()):
            raise ValueError("Name must contain only alphabets")
        return value.strip() if value else value

    @validator("phone")
    def validate_phone(cls, value):
        if not PHONE_REGEX.match(value):
            raise ValueError("Invalid phone number")
        return value

    @validator("department", "location")
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

    @validator("first_name", "middle_name", "last_name")
    def validate_name(cls, value):
        if value and not NAME_REGEX.match(value.strip()):
            raise ValueError("Invalid name format")
        return value.strip() if value else value

    @validator("phone")
    def validate_phone(cls, value):
        if value and not PHONE_REGEX.match(value):
            raise ValueError("Invalid phone number")
        return value

@router.post("/create")
async def create_user(
    payload: UserCreate,
    current_user: dict = Depends(require_permission("USER_MANAGE"))
):
    """
    Create a new user
    """
    try:
        user_service = UserService()

        user_email =  current_user.get("email")
        user_id = await user_service.create_user(
            first_name=payload.first_name,
            middle_name=payload.middle_name,
            last_name=payload.last_name,
            email=payload.email,
            phone=payload.phone,
            hashed_password=payload.hashed_password,
            role_id=payload.role_id,
            employee_id = payload.employee_id,
            department=payload.department,
            location=payload.location,
            reporting_manager=payload.reporting_manager,
            created_by=user_email,
        )

        return {
            "message": "User created successfully",
            "user_id": user_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.put("/update/{user_id}")
async def update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: dict = Depends(require_permission("USER_MANAGE"))
):
    """
    Update user details
    """
    try:
        user_service = UserService()

        user_email =  current_user.get("email")

        updated = await user_service.update_user(
            user_id=user_id,
            first_name=payload.first_name,
            middle_name=payload.middle_name,
            last_name=payload.last_name,
            phone=payload.phone,
            hashed_password=payload.hashed_password,
            role_id=payload.role_id,
            employee_id=payload.employee_id,
            department=payload.department,
            location=payload.location,
            reporting_manager=payload.reporting_manager,
            is_active=payload.is_active,
            updated_by=user_email
        )

        return {
            "success": True,
            "message": "User updated successfully" if updated else "No changes applied",
            "updated": updated
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update user"
        )



@router.delete("/delete/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_permission("USER_MANAGE"))
):
    """
    Delete a user
    """
    try:
        user_service = UserService()
        await user_service.delete_user(user_id)

        return {
            "message": "User deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")
    

@router.get("/get-all-users")
async def get_all_users(
    current_user: dict = Depends(require_permission("USER_VIEW"))
):
    """
    Fetch all users
    """
    try:
        user_service = UserService()
        db = user_service.db
        created_by = current_user.get("email")
        users = []
        cursor = db["users"].find(
            {},
            {
                "password": 0  # never expose password
            }
        )

        async for user in cursor:
            user["_id"] = str(user["_id"])  # ObjectId → string
            users.append(user)

        return users

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")
    

@router.get("/get-user-by-id/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(require_permission("USER_VIEW"))
):
    """
    Fetch single user by ID
    """
    try:
        user_service = UserService()
        db = user_service.db

        user = await db["users"].find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user["_id"] = str(user["_id"])
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")
