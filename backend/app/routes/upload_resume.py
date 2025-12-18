from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, Request
from ..schemas.interview_schema import (
    InterviewCreate, InterviewUpdate, InterviewResponse, InterviewListResponse
)
from ..services.interview_service import InterviewService
from ..utils.auth_dependency import get_current_user
from ..services.resume_upload_service import save_files
from typing import Optional
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Interviews"])

@router.post("/upload-resume")
async def upload_resume(
    jd: UploadFile = File(...),
    resume: UploadFile = File(...),
    candidate_email: str = Form(...),
    session_data: dict = Depends(get_current_user)   # <-- JWT auth
):
    """
    Upload JD and resume files for a candidate (requires JWT via Authorization header)
    """
    admin_id = session_data.get("admin_id")
    logger.info(f"Admin {admin_id} uploaded files for candidate {candidate_email}")
    logger.info(f"Received upload request: JD={jd.filename}, Resume={resume.filename}")

    try:
        await save_files(candidate_email, jd, resume)
        return {"message": "Files uploaded successfully", "admin_id": admin_id}
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")