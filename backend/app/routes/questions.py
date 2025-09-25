from fastapi import APIRouter, HTTPException
from typing import List

from app.models.question import (
    Question,
    QuestionGenerationRequest,
    MultipleQuestionsRequest
)
from app.services.question_service import question_service

router = APIRouter()

@router.post("/generate", response_model=Question)
async def generate_question(request: QuestionGenerationRequest):
    """
    Generate a programming question
    """
    try:
        question = await question_service.generate_question(
            difficulty=request.difficulty,
            topic=request.topic
        )
        return question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-multiple", response_model=List[Question])
async def generate_multiple_questions(request: MultipleQuestionsRequest):
    """
    Generate multiple programming questions
    """
    try:
        questions = await question_service.generate_multiple_questions(
            count=request.count,
            difficulty=request.difficulty
        )
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fallback", response_model=Question)
async def get_fallback_question(difficulty: str = "easy", topic: str = "string manipulation"):
    """
    Get a fallback question
    """
    try:
        question = await question_service.generate_fallback_question(
            difficulty=difficulty,
            topic=topic
        )
        return question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))