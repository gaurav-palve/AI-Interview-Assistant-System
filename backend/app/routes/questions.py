from fastapi import APIRouter, HTTPException, Body
from app.services.coding_questions_generation_service import coding_questions_service
from app.database import fetch_coding_questions, save_coding_round_answers, get_database
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class CodingQuestionsRequest(BaseModel):
    interview_id: str
    count: int = 3
    difficulty: str = "medium"
class CodingAnswerSubmission(BaseModel):
    interview_id: str = Field(..., description="The ID of the interview session")
    question_id: int = Field(..., description="The ID of the question being answered")
    candidate_answer: str = Field(..., description="The candidate's submitted code")
    test_results: List[Dict[str, Any]] = Field(..., description="Results of test case execution")


@router.post("/generate-coding-questions")
async def generate_questions(request: CodingQuestionsRequest = Body(...)):
    """
    Generate and save coding questions for an interview session.
    
    Args:
        interview_id: The ID of the interview session
        count: Number of questions to generate
        difficulty: Difficulty level of questions
        
    Returns:
        Document ID of the saved questions
    """
    try:
        logger.info(f"Generating coding questions with interview_id: {request.interview_id}")
        
        # Validate interview_id
        if not request.interview_id or request.interview_id == "default":
            logger.error(f"Invalid interview_id: {request.interview_id}")
            raise HTTPException(status_code=400, detail="Invalid interview_id. Must be a valid non-default ID.")
        
        doc_id = await coding_questions_service.generate_and_save_coding_questions(
            request.interview_id, request.count, request.difficulty
        )
        
        logger.info(f"Successfully generated coding questions. doc_id: {doc_id}, interview_id: {request.interview_id}")
        return {"success": True, "doc_id": doc_id, "interview_id": request.interview_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fetch-coding-questions/{interview_id}")
async def fetch_questions(interview_id: str):
    """
    Fetch coding questions for a specific interview session.
    
    Args:
        interview_id: The ID of the interview session
        
    Returns:
        List of question objects
    """
    try:
        logger.info(f"Fetching coding questions for interview_id: {interview_id}")
        
        # Validate interview_id
        if not interview_id or interview_id == "default":
            logger.error(f"Invalid interview_id: {interview_id}")
            raise HTTPException(status_code=400, detail="Invalid interview_id. Must be a valid non-default ID.")
        
        questions = await fetch_coding_questions(interview_id)
        
        if not questions:
            logger.warning(f"No questions found for interview_id: {interview_id}")
            raise HTTPException(status_code=404, detail=f"No questions found for interview_id: {interview_id}")
        
        logger.info(f"Successfully fetched {len(questions)} coding questions for interview_id: {interview_id}")
        return questions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-coding-answer")
async def save_coding_answer(submission: CodingAnswerSubmission = Body(...)):
    """
    Save a candidate's coding answer and test results.
    
    Args:
        submission: The submission data containing interview_id, question_id,
                   candidate_answer, and test_results
        
    Returns:
        Success status and message
    """
    try:
        logger.info(f"Saving coding answer for interview_id: {submission.interview_id}, question_id: {submission.question_id}")
        
        # Validate interview_id
        if not submission.interview_id or submission.interview_id == "default":
            logger.error(f"Invalid interview_id: {submission.interview_id}")
            raise HTTPException(status_code=400, detail="Invalid interview_id. Must be a valid non-default ID.")
        
        # Get database instance
        db = get_database()
        
        # Save the coding answer
        await save_coding_round_answers(
            db,
            submission.interview_id,
            submission.question_id,
            submission.candidate_answer,
            submission.test_results
        )
        
        logger.info(f"Successfully saved coding answer for interview_id: {submission.interview_id}, question_id: {submission.question_id}")
        return {
            "success": True,
            "message": "Coding answer saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving coding answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))
