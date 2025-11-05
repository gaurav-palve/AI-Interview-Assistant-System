from ..database import get_database, AUTH_COLLECTION
from ..models.user_model import admin_dict
from ..utils.password_handler import hash_password, verify_password
from bson import ObjectId
import logging
import secrets
import time
from fastapi import Query, Body, Depends, Request, Header
from fastapi import HTTPException
from app.utils.validate_password_strength import validate_password_strength 

logger = logging.getLogger(__name__)

# Simple in-memory session storage (in production, use Redis or database)
admin_sessions = {}

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

async def authenticate_admin(email: str, password: str):
    try:
        db = get_database()
        admin = await db[AUTH_COLLECTION].find_one({"email": email})
        if not admin or not verify_password(password, admin["hashed_password"]):
            return None
        
        # Create a simple session token
        session_token = secrets.token_urlsafe(32)
        session_data = {
            "admin_id": str(admin["_id"]),
            "email": admin["email"],
            "role": admin["role"],
            "created_at": time.time(),
            "expires_at": time.time() + (24 * 60 * 60)  # 24 hours
        }
        
        admin_sessions[session_token] = session_data
        logger.info(f"Admin authenticated successfully: {email}")
        return session_token
    except Exception as e:
        logger.error(f"Error authenticating admin: {e}")
        raise

async def verify_session(session_token: str = Query(None)):
    """Verify if a session token is valid"""
    if not session_token or session_token not in admin_sessions:
        return None
    
    session_data = admin_sessions[session_token]
    if time.time() > session_data["expires_at"]:
        # Remove expired session
        del admin_sessions[session_token]
        return None
    
    return session_data

async def logout_admin(session_token: str):
    """Logout admin by removing session"""
    if session_token in admin_sessions:
        del admin_sessions[session_token]
        logger.info("Admin logged out successfully")
        return True
    return False
