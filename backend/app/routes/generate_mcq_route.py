from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Body
from ..services.interview_service import InterviewService
from ..services.mcq_generation_service import generate_mcqs
from ..services.resume_upload_service import save_files
from ..utils.extract_jd_text import extract_text_from_jd
from ..utils.extract_resume_text import extract_text_from_resume
from ..services.auth_service import verify_session
from typing import Optional, Dict
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/interviews", tags=["Interviews"])

class MCQGenerationRequest(BaseModel):
    candidate_email: str

@router.post("/generate-mcqs")
async def generate_mcqs_route(
    request: MCQGenerationRequest = Body(...),
    session_token: str = Query(None)
):
    """
    Generate MCQs based on the candidate's resume and job description
    
    Requires authentication with a valid session token
    """
    # Verify session
    session_data = await verify_session(session_token)
    if not session_data:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    admin_id = session_data.get("admin_id")
    candidate_email = request.candidate_email
    logger.info(f"Admin {admin_id} requested to generate MCQs for candidate {candidate_email}")
    
    try:
        jd_text = await extract_text_from_jd(candidate_email)
        resume_text = await extract_text_from_resume(candidate_email)
        response = await generate_mcqs(jd_text, resume_text)

        return response
    except Exception as e:
        logger.error(f"Error generating MCQs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating MCQs: {str(e)}")
