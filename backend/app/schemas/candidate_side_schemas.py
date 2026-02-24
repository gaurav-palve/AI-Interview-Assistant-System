from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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

class MCQGenerationRequest(BaseModel):
    candidate_email: str
    request_id: Optional[str] = Field(None, description="Unique request ID for tracking and deduplication")
