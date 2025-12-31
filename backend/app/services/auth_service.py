from ..database import get_database, USERS_COLLECTION
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

async def create_super_admin_account(
    first_name: str,
    middle_name: str,
    last_name: str,
    mobile_number,
    email: str,
    password: str,
    role_id: str = None
    ):
    try:
        db = get_database()
        # validate_password_strength is synchronous and will raise HTTPException on failure
        validate_password_strength(password)
        # Check if admin already exists
        existing_admin = await db[USERS_COLLECTION].find_one({"email": email})
        if existing_admin:
            return None  # Already exists

        hashed_pw = hash_password(password)
        admin_data = admin_dict(
            first_name,
            middle_name,
            last_name,
            mobile_number,
            email, 
            hashed_pw,
            role_id
        )

        result = await db[USERS_COLLECTION].insert_one(admin_data)
        logger.info(f"Super admin account created for email: {email}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating super admin account: {e}")
        raise



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
        user = await db[USERS_COLLECTION].find_one({"email": email})
        print(user)
        if not user or not verify_password(password, user["hashed_password"]):
            return None
        
        user_id = str(user["_id"])
        
        # Create access token
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user_id},
            expires_delta=expires_delta
        )
        
        # Create refresh token and store in database
        refresh_token, refresh_expiry = await create_refresh_token(
            user_id=user_id,
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
            "user_name":user.get("first_name")+' '+user.get("last_name"),
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
        }
    except Exception as e:
        logger.error(f"Error authenticating admin: {e}")
        raise

async def verify_token_from_header(request: Request) -> dict:
    access_token = get_access_token_from_request(request)

    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access token")

    payload = decode_jwt_token(access_token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    return payload   # ✅ RETURN JWT PAYLOAD AS-IS

# For backward compatibility, redirect to header-only function
async def verify_token_from_query_or_header(request: Request):
    """
    Legacy function - now only extracts token from Authorization header.
    """
    logger.warning("verify_token_from_query_or_header is deprecated. Use verify_token_from_header instead.")
    return await verify_token_from_header(request)

async def get_token_from_request(request: Request):
    """Extract token from request's Authorization header only"""
    # Only extract from Authorization header
    token = get_access_token_from_request(request)
    
    if not token:
        logger.warning("Authentication attempt without Authorization header")
    
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
        token_data = await verify_refresh_token(refresh_token)
        user_id = token_data["user_id"]
        
        if not token_data or "user_id" not in token_data:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Rotate the refresh token (revoke the old one and create a new one)
        new_refresh_token, refresh_expiry = await rotate_refresh_token(
            refresh_token,
            device_info=device_info
        )
        
        # Create a new access token
        access_token = create_access_token(
            data={"user_id": user_id, "type":"access"},
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
        
        logger.info("User logged out successfully")
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
