from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.utils.auth_dependency import get_current_user, require_permission
from fastapi.params import Depends
from app.RBAC.role_creation import create_role, update_role
from pydantic import BaseModel
from app.database import ROLES_COLLECTION, get_database, PERMISSIONS_COLLECTION
from typing import List

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class CreateRoleRequest(BaseModel):
    name: str
    description: str
    permissions: List[str] = []


class UpdateRoleRequest(BaseModel):
    name: str = None
    description: str = None
    is_active: bool = None
    permissions: List[str] = None

## permissions response models
class PermissionResponse(BaseModel):
    code: str
    module: str
    description: str
    
class GetPermissionsResponse(BaseModel):
    status: str
    permissions: List[PermissionResponse]



@router.post("/create-role", response_model=dict)
async def create_role_endpoint(
    request: CreateRoleRequest,
    current_user: dict = Depends(require_permission("ROLE_MANAGE"))
):
    try:
        result = await create_role(
            role_name=request.name,
            description=request.description,
            created_by=current_user.get("email"),
            permissions=request.permissions
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
    current_user: dict = Depends(require_permission("ROLE_VIEW"))
):
    try:
        db = get_database()
        user_mail = current_user.get("email")
        role_id = current_user.get("role_id")
        
        # Check if user is a superadmin
        is_superadmin = False
        if role_id:
            role_id_obj = role_id["_id"] if isinstance(role_id, dict) else role_id
            role = await db[ROLES_COLLECTION].find_one(
                {"_id": ObjectId(role_id_obj)},
                {"role_name": 1}
            )
            if role and role.get("role_name") == "SUPER_ADMIN":
                is_superadmin = True
        
        # Fetch roles based on user type
        if is_superadmin:
            # Superadmin can see all roles
            roles = await db[ROLES_COLLECTION].find({}).to_list(length=None)
        else:
            # Regular users can only see roles that were delegated to them
            assignable_role_ids = current_user.get("assignable_role_ids", [])
            
            # Convert string IDs to ObjectId
            assignable_role_obj_ids = [ObjectId(role_id) for role_id in assignable_role_ids]
            
            if assignable_role_obj_ids:
                # User has delegatable roles
                roles = await db[ROLES_COLLECTION].find(
                    {"_id": {"$in": assignable_role_obj_ids}}
                ).to_list(length=None)
            else:
                # User has no delegatable roles
                roles = []

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


@router.get("/get-role/{role_id}", response_model=dict)
async def get_role_endpoint(
    role_id: str,
    current_user: dict = Depends(require_permission("ROLE_VIEW"))
):
    """
    Get a single role by ID.
    Only returns roles created by the current user.
    """
    try:
        db = get_database()
        from bson import ObjectId
        
        try:
            role_obj_id = ObjectId(role_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role ID format"
            )
            
        role = await db[ROLES_COLLECTION].find_one({
            "_id": role_obj_id,
            "created_by": current_user.get("email")
        })
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found or you don't have permission to view it"
            )
        
        # Convert ObjectId to string
        role["_id"] = str(role["_id"])
        
        return {
            "status": "success",
            "role": role
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_role_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role"
        )


@router.put("/edit-role/{role_id}", response_model=dict)
async def edit_role_endpoint(
    role_id: str,
    request: UpdateRoleRequest,
    current_user: dict = Depends(require_permission("ROLE_MANAGE"))
):
    """
    Update an existing role with new values.
    Only provided values will be updated.
    """
    try:
        # Check if the role exists and belongs to the current user
        db = get_database()
        from bson import ObjectId
        
        try:
            role_obj_id = ObjectId(role_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role ID format"
            )
            
        existing_role = await db[ROLES_COLLECTION].find_one({
            "_id": role_obj_id,
            "created_by": current_user.get("email")
        })
        
        if not existing_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found or you don't have permission to edit it"
            )
        
        # Update the role
        result = await update_role(
            role_id=role_id,
            role_name=request.name,
            description=request.description,
            is_active=request.is_active,
            permissions=request.permissions,
            updated_by=current_user.get("email")
        )

        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )

        return {
            "message": "Role updated successfully",
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in edit_role_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update role"
        )


@router.get("/get_permissions",response_model=GetPermissionsResponse,status_code=status.HTTP_200_OK)
async def get_permissions(
    current_user: dict = Depends(require_permission("ROLE_MANAGE"))
):
    try:
        db = get_database()

        permissions = await db[PERMISSIONS_COLLECTION].find(
            {},
            {
                "_id": 0,
                "code": 1,
                "module": 1,
                "description": 1
            }
        ).to_list(length=None)

        logger.info(
            f"Fetched {len(permissions)} permissions for user {current_user.get('email')}"
        )
        print(permissions)
        print(30*"-")
        return {
            "status": "success",
            "permissions": permissions
        }
    except Exception as e:
        logger.error(f"Error fetching permissions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch permissions"
        )


@router.delete("/delete-role/{role_id}", response_model=dict)
async def delete_role_endpoint(
    role_id: str,
    current_user: dict = Depends(require_permission("ROLE_MANAGE"))
):
    """
    Delete a role by ID.
    Only roles created by the current user can be deleted.
    """
    try:
        db = get_database()
        
        try:
            role_obj_id = ObjectId(role_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role ID format"
            )
            
        # Check if the role exists and belongs to the current user
        existing_role = await db[ROLES_COLLECTION].find_one({
            "_id": role_obj_id,
            "created_by": current_user.get("email")
        })
        
        if not existing_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found or you don't have permission to delete it"
            )
        
        # Check if any users are assigned this role
        users_with_role = await db["users"].count_documents({"role_id": str(role_obj_id)})
        
        if users_with_role > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role: {users_with_role} users are currently assigned to this role"
            )
        
        # Delete the role
        result = await db[ROLES_COLLECTION].delete_one({"_id": role_obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete role"
            )
        
        return {
            "message": "Role deleted successfully",
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_role_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete role"
        )

