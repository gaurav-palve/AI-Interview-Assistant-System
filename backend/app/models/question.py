from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class TestCase(BaseModel):
    input: str = Field(..., description="Input for the test case")
    expectedOutput: str = Field(..., description="Expected output for the test case")
    explanation: Optional[str] = Field(None, description="Explanation of the test case")

class Question(BaseModel):
    id: Optional[int] = Field(None, description="Question ID")
    title: str = Field(..., description="Question title")
    difficulty: str = Field(..., description="Difficulty level (easy, medium, hard)")
    description: str = Field(..., description="Detailed problem description")
    testCases: List[TestCase] = Field(..., description="Test cases for the question")
    functionSignature: str = Field(..., description="Function signature")
    solutionTemplate: Optional[str] = Field(None, description="Solution template")
    solutionTemplates: Optional[Dict[str, str]] = Field(None, description="Solution templates for different languages")
    topic: Optional[str] = Field(None, description="Question topic")

class QuestionGenerationRequest(BaseModel):
    difficulty: str = Field("easy", description="Difficulty level (easy, medium, hard)")
    topic: Optional[str] = Field(None, description="Question topic")

class MultipleQuestionsRequest(BaseModel):
    count: int = Field(3, description="Number of questions to generate")
    difficulty: str = Field("easy", description="Difficulty level (easy, medium, hard)")