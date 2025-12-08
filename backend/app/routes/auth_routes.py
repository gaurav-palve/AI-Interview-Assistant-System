from fastapi import APIRouter, HTTPException, Depends, Request, Response, Cookie, Body
from typing import Optional, Dict
import logging
from app.utils.otp_verification import verify_otp
from app.utils.email_domain_validator import validate_domain
from app.database import AUTH_COLLECTION, OTP_COLLECTION, get_database
import random
from datetime import datetime, timedelta
from app.services.email_service import EmailService
from ..schemas.auth_schema import (
    AdminSignupRequest,
    AdminSignupResponse,
    AdminSigninRequest,
    AdminSigninResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutRequest,
    OTPResponse,
    EmailRequest,
    OTPVerifyRequest,
    CreateAccountRequest
)
from ..services.auth_service import (
    REFRESH_TOKEN_COOKIE_SECURE,
    create_admin_account,
    authenticate_admin,
    verify_token_from_query_or_header,
    refresh_auth_tokens,
    logout_admin,
    REFRESH_TOKEN_COOKIE_KEY
)

# Initialize logger
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

# --- Admin Signup ---
@router.post("/signup/send-otp", response_model=OTPResponse)
async def admin_signup(payload: EmailRequest):
    validate_domain(payload.email)

    db = get_database()

    existing_admin = await db[AUTH_COLLECTION].find_one({"email": payload.email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")

    otp = random.randint(100000, 999999)
    expiry = datetime.utcnow() + timedelta(minutes=5)

    await db[OTP_COLLECTION].update_one(
        {"email": payload.email},
        {"$set": {"otp": otp, "expires_at": expiry}},
        upsert=True
    )

    emailobject = EmailService()
    await emailobject.send_signup_verification_email(payload.email, otp)

    return {"message": "OTP sent to email"}

@router.post("/verify-otp", response_model=OTPResponse)
async def verify_signup_otp(payload: OTPVerifyRequest):
    db = get_database()

    is_verified = await verify_otp(db, payload.email, payload.otp, OTP_COLLECTION)
    if is_verified is False:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    return {"message": "OTP verified successfully"}

@router.post("/create-account", response_model=AdminSignupResponse)
async def create_account(payload: CreateAccountRequest):
    db = get_database()

    # This verifies if OTP was verified earlier
    record = await db[OTP_COLLECTION].find_one({"email": payload.email})
    if not record:
        raise HTTPException(status_code=400, detail="Email not verified")

    admin_id = await create_admin_account(payload.email, payload.password)

    # Delete OTP record once done
    await db[OTP_COLLECTION].delete_one({"email": payload.email})

    return {"message": "Admin account created", "admin_id": str(admin_id)}


# --- Admin Signin ---
@router.post("/signin", response_model=AdminSigninResponse, status_code=200)
async def admin_signin(
    payload: AdminSigninRequest,
    response: Response
):
    try:
        # Log request for debugging
        logger.info(f"Admin signin attempt for email: {payload.email}")
        
        # Get device info from request body if available
        device_info = payload.device_info if hasattr(payload, 'device_info') else None
        
        # Log raw request data for debugging
        logger.info(f"Auth request: email={payload.email}, has_device_info={hasattr(payload, 'device_info')}")
        
        token_response = await authenticate_admin(
            email=payload.email,
            password=payload.password,
            response=response,
            device_info=device_info
        )
        
        if not token_response:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"Admin authenticated successfully: {payload.email}")
        logger.info(f"Token response keys: {token_response.keys()}")
        
    except HTTPException as e:
        logger.error(f"HTTP exception during login: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during login")

    # Construct a valid response that matches the AdminSigninResponse model
    return {
        "access_token": token_response["access_token"],
        "token_type": token_response["token_type"],
        "refresh_token": token_response["refresh_token"],
        "message": "Login successful"  # Make sure this required field is included
    }


# --- Verify JWT (Protected Route) ---
@router.get("/verify-token")
async def verify_token(request: Request):
    """
    Protected route that verifies if JWT access token is valid.
    Returns admin information if token is valid.
    """
    try:
        # This will raise an HTTPException if token is invalid
        current_admin = await verify_token_from_query_or_header(request)
        
        # If we get here, token is valid
        return {
            "message": "Token is valid",
            "admin": current_admin,
            "valid": True
        }
    except HTTPException:
        # Pass through HTTP exceptions (401, etc.)
        raise
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error verifying token: {str(e)}")
# --- Refresh Token ---
@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: Request,
    response: Response,
    refresh_data: Optional[RefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias=REFRESH_TOKEN_COOKIE_KEY)
):
    """
    Exchange a refresh token for a new access token and refresh token.
    The refresh token can be provided in the request body or as a cookie.
    """
    # Get refresh token from cookie or request body
    refresh_token = refresh_token_cookie
    device_info = None
    
    # Get device info from request body if available
    if refresh_data:
        # Only use token from body if cookie is not present
        if not refresh_token and refresh_data.refresh_token:
            refresh_token = refresh_data.refresh_token
        device_info = refresh_data.device_info
    
    if not refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Refresh token is required"
        )
    
    try:
        # Refresh the tokens
        token_response = await refresh_auth_tokens(
            refresh_token,
            response=response,
            device_info=device_info
        )
        
        return {
            "access_token": token_response["access_token"],
            "token_type": token_response["token_type"],
            "refresh_token": token_response["refresh_token"]
        }
    except HTTPException as e:
        # If refresh failed due to an invalid token, clear the cookie
        if e.status_code == 401:
            logger.warning("Invalid refresh token attempt - clearing cookie")
            response.delete_cookie(
                key=REFRESH_TOKEN_COOKIE_KEY,
                httponly=True,
                secure=REFRESH_TOKEN_COOKIE_SECURE,
                samesite="lax"
            )
        raise

# --- Logout ---
@router.post("/logout")
async def admin_logout(
    response: Response,
    refresh_data: Optional[RefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias=REFRESH_TOKEN_COOKIE_KEY)
):
    """
    Logout by revoking the refresh token.
    The refresh token can be provided in the request body or as a cookie.
    """
    # Get refresh token from cookie or request body
    refresh_token = refresh_token_cookie
    
    if refresh_data and refresh_data.refresh_token:
        refresh_token = refresh_data.refresh_token
    
    if not refresh_token:
        # If no token provided, just clear the cookie
        logger.info("Logout with no token - clearing cookie only")
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_KEY,
            httponly=True,
            secure=REFRESH_TOKEN_COOKIE_SECURE,
            samesite="lax"
        )
        return {"message": "Logout successful"}
    
    # Revoke the token and clear cookie
    result = await logout_admin(refresh_token, response=response)
    return result
