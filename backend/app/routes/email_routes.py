from fastapi import APIRouter, HTTPException, Query, Body, File, UploadFile, Form
from fastapi.params import Depends
from ..services.email_service import EmailService
from ..utils.auth_dependency import get_current_user
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from typing import Optional
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Emails"])

class EmailConfirmationRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str

class CustomEmailConfirmationRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str
    custom_body: str
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
    session_data: dict = Depends(get_current_user)
):

    """Send interview confirmation email"""
    
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
        raise HTTPException(status_code=500, detail="Failed to send confirmation email")  
    except Exception as e:
        logger.error(f"Error sending confirmation email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending confirmation email: {str(e)}")

@router.post("/send-reminder")
async def send_reminder_email(
    request: EmailReminderRequest,
    session_data: dict = Depends(get_current_user)
):
    
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
    session_data: dict = Depends(get_current_user)
):
    """Test email configuration by sending a test email"""
    
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

@router.post("/send-custom-confirmation")
async def send_custom_confirmation_email(
    candidate_email: str = Form(...),
    candidate_name: str = Form(...),
    job_role: str = Form(...),
    scheduled_datetime: str = Form(...),
    interview_id: str = Form(...),
    custom_body: str = Form(...),
    attachments: List[UploadFile] = File(None),
    session_data: dict = Depends(get_current_user)
):
    """Send custom confirmation email with optional attachments"""
    
    admin_id = session_data.get("admin_id")
    logger.info(f"Admin {admin_id} requested to send custom confirmation email to {candidate_email}")
    
    try:
        email_service = EmailService()
        
        # Check if SMTP credentials are configured
        if not email_service.smtp_username or not email_service.smtp_password:
            raise HTTPException(
                status_code=500,
                detail="SMTP credentials not configured. Please check your .env file."
            )
        
        # Process attachments if provided
        attachment_data = []
        if attachments:
            for attachment in attachments:
                if attachment.filename:
                    content = await attachment.read()
                    attachment_data.append({
                        'data': content,
                        'filename': attachment.filename,
                        'content_type': attachment.content_type or 'application/octet-stream'
                    })
                    logger.info(f"Processed attachment: {attachment.filename} ({attachment.content_type})")
        
        result = await email_service.send_custom_confirmation_email(
            candidate_email=candidate_email,
            candidate_name=candidate_name,
            job_role=job_role,
           
            scheduled_datetime=scheduled_datetime,
            interview_id=interview_id,
            custom_body=custom_body,
            attachments=attachment_data if attachment_data else None,
            )
        
        if result:
            return {"message": "Custom confirmation email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send custom confirmation email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending custom confirmation email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending custom confirmation email: {str(e)}")