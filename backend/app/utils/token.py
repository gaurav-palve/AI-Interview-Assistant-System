import hashlib
import os
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import uuid
from jose import jwt
from bson import ObjectId
from fastapi import Request, HTTPException
from dotenv import load_dotenv

from ..database import get_database

# Load environment variables
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Environment variables
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))

# Define collection name for refresh tokens
REFRESH_TOKENS_COLLECTION = "refresh_tokens"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
    "exp": expire,
    "type": "access"
})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



async def create_refresh_token(
        user_id: str, 
        device_info: Optional[Dict] = None) -> Tuple[str, datetime]:
    """
    Generate a JWT refresh token and store jti in DB for rotation/revocation.
    Returns (token, expires_at)
    """

    db = get_database()

    # Make sure user_id is a string
    if isinstance(user_id, ObjectId):
        user_id = str(user_id)

    # Unique ID for refresh token
    jti = str(uuid.uuid4())

    # Expiry
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # JWT payload
    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "exp": expires_at
    }

    # Create JWT token
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # Hash the token before storing
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    # Store refresh token metadata in DB
    token_data = {
        "jti": jti,
        "token_hash": token_hash,
        "user_id": user_id,
        "created_at": created_at,
        "expires_at": expires_at,
        "is_revoked": False,
        "device_info": device_info or {}
    }

    await db[REFRESH_TOKENS_COLLECTION].insert_one(token_data)

    # Return only what authenticate_admin expects
    return token, expires_at


async def verify_refresh_token(token: str) -> dict:
    """
    Verify a refresh token and ensure it's valid.
    Returns admin_id if valid.
    Raises HTTPException if token is invalid, expired, or revoked.
    """
    try:
        # Decode the token to get payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract token identifier and user id
        jti = payload.get("jti")
        user_id = payload.get("sub")
        token_type = payload.get("type")

        # Validate token structure
        if not jti or not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        # Check in database to verify token is valid
        db = get_database()
        token_data = await db[REFRESH_TOKENS_COLLECTION].find_one({"jti": jti, "token_hash": token_hash})

        if not token_data:
            raise HTTPException(status_code=401, detail="Refresh token not found")

        if token_data.get("is_revoked"):
            raise HTTPException(status_code=401, detail="Refresh token revoked")
       
        # Check expiration
        if datetime.utcnow() > token_data["expires_at"]:
            raise HTTPException(status_code=401, detail="Refresh token expired")

        logger.info(f"Refresh token verified successfully: {jti}")
        return {
            "user_id": user_id,  # Return as admin_id to maintain consistency
            "jti": jti
        }
    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token JWT expired")
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.JWTError as e:
        logger.warning(f"JWT error while verifying refresh token: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def revoke_refresh_token(token: str) -> bool:
    """
    Revoke a JWT refresh token by using its jti.
    Sets is_revoked = True for that token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        token_type = payload.get("type")

        if not jti or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
     # Hash token to match DB entry
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db = get_database()

    result = await db[REFRESH_TOKENS_COLLECTION].update_one(
        {"jti": jti,
          "token_hash": token_hash,
            "is_revoked": False},
        {
            "$set": {
                "is_revoked": True,
                "revoked_at": datetime.utcnow()}
    }
    )

    if result.modified_count == 1:
        logger.info(f"Refresh token revoked successfully (jti={jti})")
        return True

    logger.warning(f"Refresh token not found or already revoked (jti={jti})")
    return False

async def rotate_refresh_token(token: str, device_info: Optional[Dict] = None) -> Tuple[str, datetime]:
    token_data = await verify_refresh_token(token)
    user_id = token_data["user_id"]

    await revoke_refresh_token(token)

    # Create new refresh token
    new_token, expires_at = await create_refresh_token(
        user_id=user_id,  # Pass as user_id because create_refresh_token expects user_id
        device_info=device_info
    )

    return new_token, expires_at

def get_access_token_from_request(request: Request) -> Optional[str]:
    """Extract ONLY the access JWT from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")

    return None

def get_refresh_token_from_request(request: Request) -> Optional[str]:
    """Extract ONLY the refresh JWT from cookies or query parameters."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        return refresh_token
    
    # fallback → query param
    refresh_token = request.query_params.get("refresh_token")
    if refresh_token:
        return refresh_token

    return None


def decode_jwt_token(token: str) -> dict:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "require": ["exp", "sub", "type"],
                "verify_signature": True,
                "verify_exp": True
            }
        )

        if payload.get("type") != "access":
            logger.warning("Invalid token type - expected access token")
            raise HTTPException(status_code=401, detail="Invalid token type")
        logger.info(f"JWT payload received: {payload}")     

        return payload
       
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token format")
