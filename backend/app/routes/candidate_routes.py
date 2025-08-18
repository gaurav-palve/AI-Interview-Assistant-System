from fastapi import APIRouter, HTTPException
from ..services.interview_service import InterviewService
from ..services.mcq_generation_service import generate_mcqs
from ..utils.extract_jd_text import extract_text_from_jd
from ..utils.extract_resume_text import extract_text_from_resume
from ..utils.logger import get_logger
from ..database import save_generated_mcqs
from typing import Dict, Any, List
from pydantic import BaseModel

logger = get_logger(__name__)
router = APIRouter(prefix="/candidate", tags=["Candidate"])

# Define request models
class MCQResponse(BaseModel):
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool

class MCQSubmission(BaseModel):
    interview_id: str
    candidate_email: str
    responses: List[MCQResponse]
    total_score: int
    max_score: int

@router.get("/interview/{interview_id}")
async def get_candidate_interview(interview_id: str) -> Dict[str, Any]:
    """
    Public endpoint for candidates to access their interview
    This endpoint does not require authentication
    """
    logger.info(f"Candidate accessing interview with ID: {interview_id}")
    
    # Validate interview ID format
    if not interview_id or len(interview_id) != 24:
        logger.warning(f"Invalid interview ID format: {interview_id}")
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    try:
        # Verify database connection
        from ..database import verify_database_connection
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed in candidate route")
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Get interview
        interview_service = InterviewService()
        logger.info(f"Retrieving interview with ID: {interview_id}")
        interview = await interview_service.get_interview(interview_id)
        
        if not interview:
            logger.warning(f"Interview not found: {interview_id}")
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Return only the necessary information for the candidate
        logger.info(f"Successfully retrieved interview {interview_id} for candidate {interview.get('candidate_email', 'unknown')}")
        
        # Create response with only the necessary fields
        response = {
            "id": interview["id"],
            "candidate_name": interview["candidate_name"],
            "candidate_email": interview["candidate_email"],
            "job_role": interview["job_role"],
            "scheduled_datetime": interview["scheduled_datetime"],
            "status": interview["status"]
        }
        
        logger.info(f"Returning interview data to candidate: {response}")
        return response
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting candidate interview {interview_id}: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/generate-mcqs/{interview_id}")
async def generate_candidate_mcqs(interview_id: str) -> str:
    """
    Generate MCQs for a candidate interview
    This endpoint does not require authentication
    """
    logger.info(f"Request to generate MCQs for interview ID: {interview_id}")
    try:
        # Verify database connection
        from ..database import verify_database_connection
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed in generate_candidate_mcqs")
            raise HTTPException(status_code=503, detail="Database service unavailable")
            
        interview_service = InterviewService()
        interview = await interview_service.get_interview(interview_id)
        
        if not interview:
            logger.warning(f"Interview not found when generating MCQs: {interview_id}")
            raise HTTPException(status_code=404, detail="Interview not found")
        
        candidate_email = interview["candidate_email"]
        logger.info(f"Generating MCQs for candidate {candidate_email} (Interview ID: {interview_id})")
        
        # Extract JD and resume text with fallback to default text
        logger.info(f"Extracting JD text for candidate: {candidate_email}")
        jd_text = await extract_text_from_jd(candidate_email)
        if not jd_text:
            logger.warning(f"Using empty JD text for candidate: {candidate_email}")
            jd_text = ""  # This should never happen now with our default text generation
        else:
            logger.info(f"Successfully extracted JD text for candidate: {candidate_email} (length: {len(jd_text)} chars)")
        
        logger.info(f"Extracting resume text for candidate: {candidate_email}")
        resume_text = await extract_text_from_resume(candidate_email)
        if not resume_text:
            logger.warning(f"Using empty resume text for candidate: {candidate_email}")
            resume_text = ""  # This should never happen now with our default text generation
        else:
            logger.info(f"Successfully extracted resume text for candidate: {candidate_email} (length: {len(resume_text)} chars)")
            
        try:
            # Generate MCQs with enhanced error handling
            logger.info(f"Generating MCQs for candidate: {candidate_email}")
            logger.info(f"JD text length: {len(jd_text)}, Resume text length: {len(resume_text)}")
            
            # Ensure we have some text to work with
            if len(jd_text.strip()) < 10 and len(resume_text.strip()) < 10:
                logger.warning("Both JD and resume texts are too short. Using default MCQs.")
                return generate_default_mcqs()
                
            response = await generate_mcqs(jd_text, resume_text)

            save_generated_mcqs(interview_id=interview_id,candidate_email=candidate_email,mcqs_text=response )
            if not response or len(response.strip()) < 20:
                logger.warning(f"Generated MCQs are too short or empty. Using default MCQs.")
                return generate_default_mcqs()
                
            logger.info(f"Successfully generated MCQs for candidate: {candidate_email} (length: {len(response)} chars)")
            logger.info(f"MCQs preview: {response[:200]}...")
            
            # Update interview status to in-progress
            logger.info(f"Updating interview status to in_progress for interview ID: {interview_id}")
            status_updated = await interview_service.update_interview_status(interview_id, "in_progress")
            if status_updated:
                logger.info(f"Successfully updated interview status for interview ID: {interview_id}")
            else:
                logger.warning(f"Failed to update interview status for interview ID: {interview_id}")
            
            return response
        except Exception as e:
            logger.error(f"Error generating MCQs: {str(e)}")
            logger.exception("Full exception details:")
            
            # Return default MCQs instead of failing
            logger.info("Returning default MCQs due to error")
            return generate_default_mcqs()
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in generate_candidate_mcqs: {e}")
        logger.exception("Full exception details:")
        
        # Return default MCQs instead of failing
        logger.info("Returning default MCQs due to error")
        return generate_default_mcqs()



def generate_default_mcqs():
    """Generate default MCQs when the actual generation fails"""
    logger.info("Generating default MCQs")
    
    default_mcqs = """
1. What is the primary responsibility of a software developer?
   a) Writing documentation
   b) Coding and programming
   c) Managing projects
   d) Customer support
Answer: b) Coding and programming

2. Which of these is a common version control system?
   a) MySQL
   b) Docker
   c) Git
   d) React
Answer: c) Git

3. What does API stand for?
   a) Application Programming Interface
   b) Automated Program Integration
   c) Application Process Integration
   d) Advanced Programming Interface
Answer: a) Application Programming Interface

4. Which of these is a NoSQL database?
   a) MySQL
   b) PostgreSQL
   c) MongoDB
   d) Oracle
Answer: c) MongoDB

5. What is the purpose of unit testing?
   a) To test the entire application
   b) To test individual components or functions
   c) To test user interfaces
   d) To test database connections
Answer: b) To test individual components or functions
"""
    
    logger.info(f"Generated default MCQs (length: {len(default_mcqs)} chars)")
    return default_mcqs.strip()