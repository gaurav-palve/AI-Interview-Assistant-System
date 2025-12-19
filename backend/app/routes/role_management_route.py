from fastapi import APIRouter, HTTPException, Depends, status
from app.utils.auth_dependency import get_current_user
from fastapi.params import Depends
from app.RBAC.role_creation import create_role
from pydantic import BaseModel
from app.database import ROLES_COLLECTION, get_database

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class CreateRoleRequest(BaseModel):
    name: str
    description: str



@router.post("/create-role", response_model=dict)
async def create_role_endpoint(
    request: CreateRoleRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = await create_role(
            role_name=request.name,
            description=request.description,
            created_by=current_user.get("email")
        )

        return {
            "message": "Role created successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in create_role_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )
    

@router.get("/get-roles", response_model=dict)
async def get_roles_endpoint(
    current_user: dict = Depends(get_current_user)
):
    try:
        db = get_database()
        user_mail = current_user.get("email")

        # ✅ FIX: NO await on find()
        roles = await db[ROLES_COLLECTION].find(
            {"created_by": user_mail}
        ).to_list(length=None)

        # Convert ObjectId → string
        for role in roles:
            role["_id"] = str(role["_id"])

        return {
            "status": "success",
            "roles": roles
        }

    except Exception as e:
        logger.error(f"Error in get_roles_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve roles"
        )
