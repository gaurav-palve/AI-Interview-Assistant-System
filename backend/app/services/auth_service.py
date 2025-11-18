from ..database import get_database, AUTH_COLLECTION
from ..models.user_model import admin_dict
from ..utils.password_handler import hash_password, verify_password
from ..utils.token import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
    get_access_token_from_request,
    get_refresh_token_from_request,
    decode_jwt_token
)
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import os
from bson import ObjectId
import logging
from fastapi import Query, Body, Depends, Request, Header, Response, Cookie
from fastapi import HTTPException
from app.utils.validate_password_strength import validate_password_strength

# Define constant for refresh token cookie
REFRESH_TOKEN_COOKIE_KEY = "refresh_token"

# Load environment variables
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))
REFRESH_TOKEN_COOKIE_SECURE = os.getenv("REFRESH_TOKEN_COOKIE_SECURE", "False").lower() in ("true", "1", "t")

logger = logging.getLogger(__name__)

async def create_admin_account(email: str, password: str):
    try:
        db = get_database()
        # validate_password_strength is synchronous and will raise HTTPException on failure
        validate_password_strength(password)
        # Check if admin already exists
        existing_admin = await db[AUTH_COLLECTION].find_one({"email": email})
        if existing_admin:
            return None  # Already exists

        hashed_pw = hash_password(password)
        admin_data = admin_dict(email, hashed_pw)
        result = await db[AUTH_COLLECTION].insert_one(admin_data)
        logger.info(f"Admin account created for email: {email}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating admin account: {e}")
        raise

async def verify_session(session_token: str = Query(None)):
    """
    Verify if a session token is valid.
    This is a compatibility function that uses JWT tokens instead of the old session storage.
    """
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Decode and validate the JWT token
        payload = decode_jwt_token(session_token)
        
        # Extract user information from the token
        admin_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token structure")
        
        # Return session data in the format expected by existing code
        return {
            "admin_id": admin_id,
            "email": email,
            "role": role
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify_session: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def authenticate_admin(
    email: str,
    password: str,
    response: Response = None,
    device_info: Optional[Dict] = None
):
    """
    Authenticate admin with email and password.
    Returns JWT tokens if successful.
    """
    try:
        db = get_database()
        admin = await db[AUTH_COLLECTION].find_one({"email": email})
        if not admin or not verify_password(password, admin["hashed_password"]):
            return None
        
        admin_id = str(admin["_id"])
        
        # Create access token
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": admin_id, "email": admin["email"], "role": admin["role"]},
            expires_delta=expires_delta
        )
        
        # Create refresh token and store in database
        refresh_token, refresh_expiry = await create_refresh_token(
            admin_id=admin_id,
            device_info=device_info
        )
        
        # If response object is provided, set refresh token as httpOnly cookie
        if response:
            response.set_cookie(
                key=REFRESH_TOKEN_COOKIE_KEY,
                value=refresh_token,
                httponly=True,
                secure=REFRESH_TOKEN_COOKIE_SECURE,
                samesite="lax",
                expires=int(refresh_expiry.timestamp())
            )
        
        logger.info(f"Admin authenticated successfully: {email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
        }
    except Exception as e:
        logger.error(f"Error authenticating admin: {e}")
        raise

async def verify_token_from_query_or_header(request: Request):
    """
    Extract and verify JWT token from query param or Authorization header.
    Returns admin data if token is valid.
    """
    # First try from Authorization header
    access_token = get_access_token_from_request(request)
    
    # If not in header, try from query parameter
    if not access_token:
        access_token = request.query_params.get("session_token")
    
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )
    
    try:
        # Decode and validate token
        payload = decode_jwt_token(access_token)
        
        # Validate token structure
        if "sub" not in payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid token structure"
            )
        
        # Return admin data from token
        return {
            "admin_id": payload["sub"],
            "email": payload.get("email"),
            "role": payload.get("role")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

async def get_token_from_request(request: Request):
    """Extract token from request (either from header or query param)"""
    # First try from Authorization header
    token = get_access_token_from_request(request)
    
    # If not found, try from query parameter
    if not token:
        token = request.query_params.get("session_token")
    
    return token

async def refresh_auth_tokens(
    refresh_token: str,
    response: Response = None,
    device_info: Optional[Dict] = None
):
    """
    Refresh authentication tokens using a refresh token.
    Returns new access and refresh tokens.
    """
    try:
        # Verify the refresh token
        admin_data = await verify_refresh_token(refresh_token)
        
        if not admin_data or "admin_id" not in admin_data:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Rotate the refresh token (revoke the old one and create a new one)
        new_refresh_token, refresh_expiry = await rotate_refresh_token(
            refresh_token,
            device_info=device_info
        )
        
        # Create a new access token
        access_token = create_access_token(
            data={"sub": admin_data["admin_id"]}
        )
        
        # If response object is provided, set new refresh token as httpOnly cookie
        if response:
            response.set_cookie(
                key=REFRESH_TOKEN_COOKIE_KEY,
                value=new_refresh_token,
                httponly=True,
                secure=REFRESH_TOKEN_COOKIE_SECURE,
                samesite="lax",
                expires=int(refresh_expiry.timestamp())
            )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": new_refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing tokens: {e}")
        raise HTTPException(status_code=500, detail="Error refreshing authentication tokens")

async def logout_admin(refresh_token: str, response: Response = None):
    """
    Logout admin by revoking refresh token and clearing cookie.
    """
    try:
        # Revoke the refresh token in the database
        revoke_result = await revoke_refresh_token(refresh_token)
        
        # If response object is provided, clear the refresh token cookie
        if response:
            response.delete_cookie(
                key=REFRESH_TOKEN_COOKIE_KEY,
                httponly=True,
                secure=REFRESH_TOKEN_COOKIE_SECURE,
                samesite="lax"
            )
        
        logger.info("Admin logged out successfully")
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        # Still clear the cookie even if token revocation fails
        if response:
            response.delete_cookie(
                key=REFRESH_TOKEN_COOKIE_KEY,
                httponly=True,
                secure=REFRESH_TOKEN_COOKIE_SECURE,
                samesite="lax"
            )
        return {"message": "Logout successful"}
