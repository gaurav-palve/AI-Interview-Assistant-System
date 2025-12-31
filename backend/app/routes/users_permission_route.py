from fastapi import APIRouter, HTTPException, Depends, status
from app.utils.auth_dependency import get_current_user
from app.database import ROLES_COLLECTION, get_database
from pydantic import BaseModel
from typing import List
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GetUserPermissionsResponse(BaseModel):
    permissions: List[str] | None = []

class GetUserRoleResponse(BaseModel):
    role_name: str



@router.get("/user/permissions", response_model=GetUserPermissionsResponse)
async def get_user_permissions(
    current_user: dict = Depends(get_current_user)
):
    try:
        db = get_database()

        role_id = current_user.get("role_id")
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no role assigned"
            )

        role = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(role_id)}
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        return GetUserPermissionsResponse(
            permissions=role.get("permissions", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user_permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user permissions"
        )
    

@router.get("/user/role", response_model=GetUserRoleResponse)
async def get_user_role(
    current_user: dict = Depends(get_current_user)
):
    try:
        db = get_database()

        role_id = current_user.get("role_id")
        role = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(role_id)}
        )

        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        return GetUserRoleResponse(
            role_name=role.get("role_name")
        )

    except Exception as e:
        logger.error(f"Error in get_user_role: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve role")

