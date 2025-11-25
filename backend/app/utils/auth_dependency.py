"""
Authentication dependency utilities for FastAPI routes.

This module provides convenience functions to easily add authentication
using JWT tokens in Authorization headers.
"""

import logging
from fastapi import Depends, Request, HTTPException
from typing import Callable, Dict, Any, Optional
from ..services.auth_service import verify_token_from_header

logger = logging.getLogger(__name__)

async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from Authorization header.
    
    Extracts and validates JWT token from the request.
    """
    try:
        current_user = await verify_token_from_header(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during authentication")

def auth_required(admin_only: bool = False) -> Callable:
    """
    Creates a dependency that requires authentication and optionally checks for admin role.
    
    Args:
        admin_only: If True, only users with admin role can access the endpoint
        
    Returns:
        A dependency function that can be used with FastAPI Depends()
    """
    async def check_auth(request: Request) -> Dict[str, Any]:
        user = await get_current_user(request)
        
        # If admin_only is True, check if user has admin role
        if admin_only and user.get("role") != "admin":
            logger.warning(f"Non-admin user {user.get('email')} attempted to access admin-only endpoint")
            raise HTTPException(status_code=403, detail="Admin privileges required")
            
        return user
        
    return check_auth

# Create commonly used dependencies
require_auth = auth_required(admin_only=False)
require_admin = auth_required(admin_only=True)