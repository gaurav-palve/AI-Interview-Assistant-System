from fastapi import APIRouter, HTTPException
from ..services.interview_service import InterviewService
from ..services.mcq_generation_service import generate_mcqs
from ..utils.extract_jd_text import extract_text_from_jd
from ..utils.extract_resume_text import extract_text_from_resume
from ..utils.logger import get_logger
from ..database import save_generated_mcqs
from typing import Dict, Any, List, Set
from pydantic import BaseModel
import time
import re
from app.database import get_and_save_interview_report_data
from app.database import fetch_interview_report_data
from app.database import save_report_pdf_to_db
from app.utils.report_pdf_generation import  build_candidate_report_pdf
from app.services.email_service import EmailService
logger = get_logger(__name__)
router = APIRouter(tags=["Candidate"])

# Track in-progress MCQ generations to prevent duplicate calls
# Dictionary mapping interview_id to timestamp when generation started
in_progress_mcq_generations: Dict[str, float] = {}
# Timeout for in-progress tracking (seconds)
IN_PROGRESS_TIMEOUT = 60

# Define request models
class MCQResponse(BaseModel):
    question: str
    question_id: int  # Add question_id field
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
        from ..database import verify_database_connection, get_database, MCQS_COLLECTION
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
        
        # Check if MCQs already exist for this interview
        db = get_database()
        existing_mcqs = await db[MCQS_COLLECTION].find_one({"interview_id": interview_id})
        
        # If MCQs don't exist, we'll set mcqs_status to "generating" but NOT trigger generation here
        # The frontend will call the dedicated MCQ generation endpoint
        if not existing_mcqs:
            logger.info(f"MCQs not found for interview {interview_id}. Will be generated when requested.")
        else:
            logger.info(f"MCQs already exist for interview {interview_id}")
        
        # Return all necessary information for the candidate
        logger.info(f"Successfully retrieved interview {interview_id} for candidate {interview.get('candidate_email', 'unknown')}")
        
        # Create response with all necessary fields
        response = {
            "id": interview["id"],
            "candidate_name": interview["candidate_name"],
            "candidate_email": interview["candidate_email"],
            "job_role": interview["job_role"],
            "job_description": interview.get("job_description", ""),
            "scheduled_datetime": interview["scheduled_datetime"],
            "status": interview["status"],
            "duration": interview.get("duration", 15),  # Default to 15 minutes
            "interview_type": interview.get("interview_type", "technical_and_behavioral"),
            "title": interview.get("title", interview["job_role"]),  # Use job_role as title if not set
            "created_at": interview.get("created_at"),
            "updated_at": interview.get("updated_at"),
            "mcqs_status": "ready" if existing_mcqs else "generating"
        }
        
        logger.info(f"Returning complete interview data to candidate: {response}")
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
    This endpoint is called explicitly by the frontend to generate MCQs
    This endpoint does not require authentication
    """
    logger.info(f"Request to generate MCQs for interview ID: {interview_id}")
    try:
        # Verify database connection
        from ..database import verify_database_connection, get_database, MCQS_COLLECTION
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed in generate_candidate_mcqs")
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Clean up expired in-progress entries
        current_time = time.time()
        expired_interviews = [
            interview_id for interview_id, start_time in in_progress_mcq_generations.items()
            if current_time - start_time > IN_PROGRESS_TIMEOUT
        ]
        for expired_id in expired_interviews:
            logger.info(f"Removing expired in-progress tracking for interview {expired_id}")
            in_progress_mcq_generations.pop(expired_id, None)
        
        # Check if MCQs are already being generated for this interview
        if interview_id in in_progress_mcq_generations:
            generation_time = in_progress_mcq_generations[interview_id]
            time_elapsed = current_time - generation_time
            
            if time_elapsed < IN_PROGRESS_TIMEOUT:
                logger.info(f"MCQ generation already in progress for interview {interview_id} (started {time_elapsed:.1f}s ago)")
                return "MCQ generation in progress. Please wait a moment and refresh the page."
            else:
                # Generation has been running too long, remove from tracking and continue
                logger.warning(f"MCQ generation for interview {interview_id} has been running for {time_elapsed:.1f}s. Restarting.")
                in_progress_mcq_generations.pop(interview_id, None)
        
        # Always proceed with generation of new MCQs
        db = get_database()
        
        # Log the request for debugging
        logger.info(f"Generating new MCQs for interview ID: {interview_id}")
        
        # Proceed with generation (MongoDB's $set will override existing data)
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
            # Mark this interview as having MCQ generation in progress
            in_progress_mcq_generations[interview_id] = time.time()
            
            # Generate MCQs with enhanced error handling
            logger.info(f"Generating MCQs for candidate: {candidate_email}")
            logger.info(f"JD text length: {len(jd_text)}, Resume text length: {len(resume_text)}")
            
            # Ensure we have some text to work with
            if len(jd_text.strip()) < 10 and len(resume_text.strip()) < 10:
                logger.warning("Both JD and resume texts are too short. Using default MCQs.")
                default_mcqs = generate_default_mcqs()
                save_generated_mcqs(interview_id=interview_id, candidate_email=candidate_email, mcqs_text=default_mcqs)
                # Remove from in-progress tracking
                in_progress_mcq_generations.pop(interview_id, None)
                return default_mcqs
                
            response = await generate_mcqs(jd_text, resume_text)

            if not response or len(response.strip()) < 20:
                logger.warning(f"Generated MCQs are too short or empty. Using default MCQs.")
                default_mcqs = generate_default_mcqs()
                save_generated_mcqs(interview_id=interview_id, candidate_email=candidate_email, mcqs_text=default_mcqs)
                # Remove from in-progress tracking
                in_progress_mcq_generations.pop(interview_id, None)
                return default_mcqs
            
            # Save the generated MCQs
            save_generated_mcqs(interview_id=interview_id, candidate_email=candidate_email, mcqs_text=response)
            
            # Remove from in-progress tracking
            in_progress_mcq_generations.pop(interview_id, None)
                
            logger.info(f"Successfully generated MCQs for candidate: {candidate_email} (length: {len(response)} chars)")
            
            # Update interview status to in-progress
            logger.info(f"Updating interview status to in_progress for interview ID: {interview_id}")
            status_updated = await interview_service.update_interview_status(interview_id, "in_progress")

            #send email to TA team notifying candidate has started the interview
            email_service = EmailService()
            await email_service.send_email_to_TA_team(candidate_email=interview["candidate_email"],
                                                      candidate_name=interview["candidate_name"],
                                                      job_role=interview["job_role"],
                                                      interview_id= str(interview_id))


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
            default_mcqs = generate_default_mcqs()
            save_generated_mcqs(interview_id=interview_id, candidate_email=candidate_email, mcqs_text=default_mcqs)
            
            # Remove from in-progress tracking
            in_progress_mcq_generations.pop(interview_id, None)
            return default_mcqs
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in generate_candidate_mcqs: {e}")
        logger.exception("Full exception details:")
        
        # Return default MCQs instead of failing
        logger.info("Returning default MCQs due to error")
        
        # Remove from in-progress tracking
        if interview_id in in_progress_mcq_generations:
            in_progress_mcq_generations.pop(interview_id, None)
            
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

@router.get("/get-mcqs/{interview_id}", response_model=str)
async def get_candidate_mcqs(interview_id: str) -> str:
    try:
        logger.info(f"Request to get MCQs for interview ID: {interview_id}")
        # Verify database connection
        from ..database import verify_database_connection, get_database, MCQS_COLLECTION
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed in get_candidate_mcqs")
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Check if MCQs exist for this interview
        db = get_database()
        existing_mcqs = await db[MCQS_COLLECTION].find_one({"interview_id": interview_id})
        
        if not existing_mcqs:
            logger.warning(f"No MCQs found for interview {interview_id}")
            raise HTTPException(status_code=404, detail="MCQs not found for this interview")
        
        # Format MCQs for frontend consumption
        if isinstance(existing_mcqs["mcqs_text"], list):
            # Structured format - convert to text with options
            mcqs_list = existing_mcqs["mcqs_text"]
            mcqs_text = ""
            
            # Filter out any invalid MCQs (like introductions or section headers)
            valid_mcqs = [mcq for mcq in mcqs_list if mcq.get("question") and not mcq["question"].startswith("Here are")]
            
            logger.info(f"Found {len(valid_mcqs)} valid MCQs out of {len(mcqs_list)} total")
            
            for idx, mcq in enumerate(valid_mcqs, start=1):
                question_text = mcq["question"]
                answer_text = mcq["answer"]
                
                # Clean up the answer text
                answer_text = answer_text.replace("**", "").strip()
                
                # Format the question
                mcqs_text += f"{idx}. {question_text}\n"
                
                # Use the options from the database if available
                if "options" in mcq and mcq["options"]:
                    options = mcq["options"]
                    for option in options:
                        mcqs_text += f"{option}\n"
                else:
                    # Fallback to generating options if not available
                    logger.warning(f"No options found for question {idx}, generating dummy options")
                    option_letters = ['a', 'b', 'c', 'd']
                    
                    # If the answer contains an option letter, extract it
                    option_letter = None
                    if answer_text and len(answer_text) > 1:
                        match = re.match(r'^([a-d])\)', answer_text)
                        if match:
                            option_letter = match.group(1)
                    
                    # Create options
                    for i in range(4):
                        letter = option_letters[i]
                        if option_letter and letter == option_letter:
                            # This is the correct answer
                            mcqs_text += f"{letter}) {answer_text.replace(f'{letter})', '').strip()}\n"
                        else:
                            # Generate a dummy option
                            mcqs_text += f"{letter}) Option {letter.upper()}\n"
                
                # Add the answer
                mcqs_text += f"Answer: {answer_text}\n\n"
            
            return mcqs_text.strip()
        else:
            # Already in text format
            return existing_mcqs["mcqs_text"]
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting MCQs: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/submit-answers/{interview_id}")
async def submit_candidate_answers(interview_id: str, submission: MCQSubmission):
    """
    Submit candidate answers for an interview
    This endpoint does not require authentication
    """
    logger.info(f"Candidate submitting answers for interview ID: {interview_id}")
    
    try:
        # Verify database connection
        from ..database import verify_database_connection, save_candidate_answer
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed in submit_candidate_answers")
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Verify interview exists
        interview_service = InterviewService()
        interview = await interview_service.get_interview(interview_id)
        
        if not interview:
            logger.warning(f"Interview not found when submitting answers: {interview_id}")
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Verify candidate email matches
        if interview["candidate_email"] != submission.candidate_email:
            logger.warning(f"Candidate email mismatch: {submission.candidate_email} vs {interview['candidate_email']}")
            raise HTTPException(status_code=400, detail="Candidate email does not match interview")
        
        # Save each answer
        success = True

        for response in submission.responses:
            # Use question_id from the response
            question_id = response.question_id
            is_correct = response.is_correct
            
            logger.info(f"Saving answer for question_id={question_id}, question={response.question[:30]}...")
            
            result = await save_candidate_answer(
                interview_id=interview_id,
                question_id=question_id,
                candidate_answer=response.selected_answer,
                is_correct=is_correct
            )
            if not result:
                success = False
                logger.error(f"Failed to save answer for question_id={question_id}, question={response.question[:30]}...")
        
        # Update interview status to mcq_completed instead of completed
        # This allows the system to know MCQs are done but voice interview should start next
        if success:
            logger.info(f"Updating interview status to mcq_completed for interview ID: {interview_id}")
            status_updated = await interview_service.update_interview_status(interview_id, "mcq_completed")
            if status_updated:
                logger.info(f"Successfully updated interview status for interview ID: {interview_id}")
            else:
                logger.warning(f"Failed to update interview status for interview ID: {interview_id}")
        
        return {
            "message": "Answers submitted successfully",
            "interview_id": interview_id,
            "total_score": submission.total_score,
            "max_score": submission.max_score,
            "status": "success" if success else "partial_success"
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error submitting candidate answers: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail="Internal server error")

## complete the full interview.
@router.post("/complete_interview/{interview_id}")
async def complete_interview(interview_id: str):
    """
    Complete an interview and update its status to completed.
    
    Args:
        interview_id: The ID of the interview to complete
        
    Returns:
        A message indicating success or failure
    """
    try:
        logger.info(f"Updating interview status to completed for interview ID: {interview_id}")
        
        # Initialize interview service
        interview_service = InterviewService()
        
        # Update interview status to completed
        status_updated = await interview_service.update_interview_status(interview_id, "completed")
        
        ## gather data for report generation
        await get_and_save_interview_report_data(interview_id)
        data = await fetch_interview_report_data(interview_id)
        pdf_data = build_candidate_report_pdf(data)
        await save_report_pdf_to_db(interview_id, pdf_data)

        if status_updated:
            logger.info(f"Successfully updated interview status to completed for interview ID: {interview_id}")
            return {"message": "Interview completed successfully"}
        else:
            logger.warning(f"Failed to update interview status to completed for interview ID: {interview_id}")
            raise HTTPException(status_code=500, detail="Failed to update interview status")
    
    except Exception as e:
        logger.error(f"Error completing interview: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail=f"Error completing interview: {str(e)}")
