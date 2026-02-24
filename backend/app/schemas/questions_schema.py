from pydantic import BaseModel, Field
from typing import List, Dict, Any

class CodingQuestionsRequest(BaseModel):
    interview_id: str
    count: int = 3
    difficulty: str = "medium"

class CodingAnswerSubmission(BaseModel):
    interview_id: str = Field(..., description="The ID of the interview session")
    question_id: int = Field(..., description="The ID of the question being answered")
    candidate_answer: str = Field(..., description="The candidate's submitted code")
    test_results: List[Dict[str, Any]] = Field(..., description="Results of test case execution")

