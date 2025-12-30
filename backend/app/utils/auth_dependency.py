"""
Authentication & Authorization dependencies for FastAPI routes.

JWT → User → Role → Permissions → Allow / Deny
"""

import logging
from fastapi import Depends, Request, HTTPException
from typing import Callable, Dict, Any, Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..services.auth_service import verify_token_from_header
from app.database import get_database, USERS_COLLECTION
from bson import ObjectId
logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------
# AUTHENTICATION (JWT → USER)
# ---------------------------------------------------------

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> Dict[str, Any]:
    """
    Extract JWT, validate it, and fetch the latest user from DB.
    """
    try:
        if not credentials:
            raise HTTPException(status_code=401, detail="Missing access token")

        payload = await verify_token_from_header(request)

        if not payload or not payload.get("user_id"):
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload["user_id"]
        db = get_database()

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        user.pop("hashed_password", None)
        user.pop("mobile_number", None)

        return user
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in get_current_user")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during authentication"
        )


def require_permission(permission: str) -> Callable:
    """
    Dependency to check if the current user has the required permission.
    SuperAdmin is identified via role.
    """
    async def check_permission(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:

        role_id = current_user.get("role_id")
        if not role_id:
            raise HTTPException(status_code=403, detail="Role not assigned")

        role_id = role_id["_id"] if isinstance(role_id, dict) else role_id
        db = get_database()
        role = await db.roles.find_one({"_id": ObjectId(role_id)})

        if not role:
            raise HTTPException(status_code=403, detail="Role not found")

        permissions = role.get("permissions", [])

        # SUPERADMIN → FULL ACCESS
        if role.get("role_name") == "SUPER_ADMIN":
            return current_user

        # Normal permission check
        permission_docs = await db["role_permissions"].find({"role_id":role["_id"]}).to_list(length=None)
        permissions = [doc["permission_code"] for doc in permission_docs]

        
        # Check if user has required permission
        if permission in permissions:
            return current_user
        logger.warning(
            f"Access denied | user={current_user['_id']} | permission={permission}"
        )
        raise HTTPException(status_code=403, detail="Access denied")

    return check_permission