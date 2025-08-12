from fastapi import APIRouter, HTTPException, Query, Body
from ..services.email_service import EmailService
from ..services.auth_service import verify_session
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/emails", tags=["Emails"])

class EmailConfirmationRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str

class EmailReminderRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str

class TestEmailRequest(BaseModel):
    test_email: EmailStr

@router.post("/send-confirmation")
async def send_confirmation_email(
    request: EmailConfirmationRequest,
    session_token: str = Query(None)
):
    """
    Send interview confirmation email to candidate
    
    Requires authentication with a valid session token
    """
    # Verify session
    session_data = await verify_session(session_token)
    if not session_data:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    admin_id = session_data.get("admin_id")
    logger.info(f"Admin {admin_id} requested to send confirmation email to {request.candidate_email}")
    
    try:
        email_service = EmailService()
        
        # Check if SMTP credentials are configured
        if not email_service.smtp_username or not email_service.smtp_password:
            raise HTTPException(
                status_code=500, 
                detail="SMTP credentials not configured. Please check your .env file."
            )
        
        result = await email_service.send_interview_confirmation(
            candidate_email=request.candidate_email,
            candidate_name=request.candidate_name,
            job_role=request.job_role,
            scheduled_datetime=request.scheduled_datetime,
            interview_id=request.interview_id
        )
        
        if result:
            return {"message": "Confirmation email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send confirmation email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending confirmation email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending confirmation email: {str(e)}")

@router.post("/send-reminder")
async def send_reminder_email(
    request: EmailReminderRequest,
    session_token: str = Query(None)
):
    """
    Send interview reminder email to candidate
    
    Requires authentication with a valid session token
    """
    # Verify session
    session_data = await verify_session(session_token)
    if not session_data:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    admin_id = session_data.get("admin_id")
    logger.info(f"Admin {admin_id} requested to send reminder email to {request.candidate_email}")
    
    try:
        email_service = EmailService()
        
        # Check if SMTP credentials are configured
        if not email_service.smtp_username or not email_service.smtp_password:
            raise HTTPException(
                status_code=500, 
                detail="SMTP credentials not configured. Please check your .env file."
            )
        
        result = await email_service.send_interview_reminder(
            candidate_email=request.candidate_email,
            candidate_name=request.candidate_name,
            job_role=request.job_role,
            scheduled_datetime=request.scheduled_datetime,
            interview_id=request.interview_id
        )
        
        if result:
            return {"message": "Reminder email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send reminder email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending reminder email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending reminder email: {str(e)}")

@router.post("/test")
async def test_email_configuration(
    request: TestEmailRequest,
    session_token: str = Query(None)
):
    """
    Test email configuration by sending a test email
    
    Requires authentication with a valid session token
    """
    # Verify session
    session_data = await verify_session(session_token)
    if not session_data:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    admin_id = session_data.get("admin_id")
    logger.info(f"Admin {admin_id} requested to test email configuration with {request.test_email}")
    
    try:
        email_service = EmailService()
        
        # Check if SMTP credentials are configured
        if not email_service.smtp_username or not email_service.smtp_password:
            raise HTTPException(
                status_code=500, 
                detail="SMTP credentials not configured. Please check your .env file."
            )
        
        result = await email_service.send_interview_confirmation(
            candidate_email=request.test_email,
            candidate_name="Test User",
            job_role="Test Position",
            scheduled_datetime="2025-08-15 10:00 AM",
            interview_id="TEST-123"
        )
        
        if result:
            return {"message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending test email: {str(e)}")