from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, timezone
import re
from app.services.user_management_service import UserService
from app.utils.logger import get_logger
from app.utils.auth_dependency import get_current_user, require_permission
from bson import ObjectId
from app.utils.build_user_tree import build_user_tree
from app.database import get_database, USERS_COLLECTION, ROLES_COLLECTION
from app.schemas.user_management_schema import UserCreate, UserUpdate

logger = get_logger(__name__)

router = APIRouter(
    tags=["Users"]
)

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
            assignable_role_ids=payload.assignable_role_ids,
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


@router.get("/user-hierarchy")
async def get_user_hierarchy(
    current_user: dict = Depends(get_current_user)
):
    """
    Get hierarchical user data showing who created whom
    """
    try:
        db = get_database()
        
        # Get all users
        users = await db[USERS_COLLECTION].find(
            {},
            {"_id": 1, "first_name": 1, "last_name": 1, "email": 1, "role_id": 1,"reporting_manager": 1}
        ).to_list(length=None)
        
        # Ensure users is a list
        if users is None:
            users = []
        
        # Convert ObjectIds to strings for JSON serialization
        for user in users:
            user["_id"] = str(user["_id"])
            user["role_id"] = str(user["role_id"]) if user.get("role_id") else None
            user["reporting_manager"] = (
                str(user["reporting_manager"])
                if user.get("reporting_manager")
                else None
            )

        
        # Get role information for each user
        for user in users:
            if "role_id" in user and user["role_id"]:
                role = await db[ROLES_COLLECTION].find_one({"_id": ObjectId(user["role_id"])})
                if role:
                    user["role_name"] = role.get("role_name")
        print(users)
        print("-----")
        hierarchy = build_user_tree(users)

        return hierarchy
    
    except Exception as e:
        logger.error(f"Error fetching user hierarchy: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user hierarchy")
