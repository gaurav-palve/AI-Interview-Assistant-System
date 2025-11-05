from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Body
from ..services.interview_service import InterviewService
from ..services.mcq_generation_service import generate_mcqs
from ..services.resume_upload_service import save_files
from ..utils.extract_jd_text import extract_text_from_jd
from ..utils.extract_resume_text import extract_text_from_resume
from ..services.auth_service import verify_session
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import logging
import time
import hashlib

logger = logging.getLogger(__name__)

# Simple in-memory cache with timestamps
mcq_cache: Dict[str, Dict[str, Any]] = {}
CACHE_EXPIRY = 300  # 5 minutes in seconds

# Track in-progress requests to prevent duplicates
in_progress_requests: Dict[str, float] = {}
router = APIRouter(prefix="/interviews", tags=["Interviews"])

class MCQGenerationRequest(BaseModel):
    candidate_email: str
    request_id: Optional[str] = Field(None, description="Unique request ID for tracking and deduplication")

@router.post("/generate-mcqs/")
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
    request_id = request.request_id or f"mcq_{candidate_email}_{int(time.time())}"
    
    logger.info(f"Admin {admin_id} requested to generate MCQs for candidate {candidate_email} (request_id: {request_id})")
    
    # Create a cache key based on candidate email
    cache_key = f"mcq_{candidate_email}"
    current_time = time.time()
    
    # Check if there's an in-progress request for this candidate
    if candidate_email in in_progress_requests:
        last_request_time = in_progress_requests[candidate_email]
        # If the request was started less than 10 seconds ago, return a message
        if current_time - last_request_time < 10:
            logger.info(f"Duplicate request detected for {candidate_email} within 10 seconds")
            return {"message": "MCQ generation already in progress. Please wait a moment and try again."}
    
    # Check cache first
    if cache_key in mcq_cache:
        cache_entry = mcq_cache[cache_key]
        # If cache is still valid
        if current_time - cache_entry["timestamp"] < CACHE_EXPIRY:
            logger.info(f"Returning cached MCQs for candidate {candidate_email}")
            return cache_entry["data"]
    
    # Mark this request as in progress
    in_progress_requests[candidate_email] = current_time
    
    try:
        # Generate new MCQs
        jd_text = await extract_text_from_jd(candidate_email)
        resume_text = await extract_text_from_resume(candidate_email)
        response = await generate_mcqs(jd_text, resume_text)
        
        # Cache the result
        mcq_cache[cache_key] = {
            "data": response,
            "timestamp": current_time
        }
        
        # Remove from in-progress tracking
        if candidate_email in in_progress_requests:
            del in_progress_requests[candidate_email]
        
        return response
    except Exception as e:
        logger.error(f"Error generating MCQs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating MCQs: {str(e)}")
