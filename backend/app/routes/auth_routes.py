from fastapi import APIRouter, HTTPException
from ..schemas.auth_schema import AdminSignupRequest, AdminSignupResponse, AdminSigninRequest, AdminSigninResponse, LogoutRequest
from ..services.auth_service import create_admin_account, authenticate_admin, logout_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=AdminSignupResponse)
async def admin_signup(payload: AdminSignupRequest):
    admin_id = await create_admin_account(payload.email, payload.password)
    if not admin_id:
        raise HTTPException(status_code=400, detail="Admin already exists")
    return {"message": "Admin account created successfully", "admin_id": admin_id}

@router.post("/signin", response_model=AdminSigninResponse)
async def admin_signin(payload: AdminSigninRequest):
    token = await authenticate_admin(payload.email, payload.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": token, "token_type": "session"}

@router.post("/logout")
async def admin_logout(payload: LogoutRequest):
    success = await logout_admin(payload.token)
    if success:
        return {"message": "Logged out successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
