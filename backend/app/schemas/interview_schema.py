from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class InterviewStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    MCQ_COMPLETED = "mcq_completed"  # Added for transition between MCQ and voice interview
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    CODING = "coding"
    SYSTEM_DESIGN = "system_design"
    GENERAL = "general"

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5, description="The interview question")
    question_type: str = Field(..., description="Type of question (e.g., technical, behavioral)")
    difficulty: str = Field(default="medium", description="Question difficulty level")
    category: str = Field(default="general", description="Question category")
    expected_answer: str = Field(default="", description="Expected answer or key points")
    scoring_criteria: List[str] = Field(default=[], description="Criteria for scoring the answer")

class CandidateCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Candidate's full name")
    email: EmailStr = Field(..., description="Candidate's email address")
    phone: str = Field(default="", description="Candidate's phone number")
    experience_years: int = Field(default=0, ge=0, description="Years of experience")
    skills: List[str] = Field(default=[], description="List of candidate skills")
    resume_url: str = Field(default="", description="URL to candidate's resume")
    notes: str = Field(default="", description="Additional notes about the candidate")

class InterviewCreate(BaseModel):
    candidate_name: str = Field(..., min_length=2, description="Candidate's full name")
    candidate_email: EmailStr = Field(..., description="Candidate's email address")
    job_role: str = Field(..., min_length=3, description="Job role for the interview")
    scheduled_datetime: datetime = Field(..., description="Scheduled interview date and time")
    status: InterviewStatus = Field(default=InterviewStatus.SCHEDULED, description="Interview status")
    resume_uploaded: Optional[bool] = Field(default=False, description="Whether resume was uploaded")
    jd_uploaded: Optional[bool] = Field(default=False, description="Whether job description was uploaded")

class InterviewUpdate(BaseModel):
    candidate_name: Optional[str] = Field(None, min_length=2)
    candidate_email: Optional[EmailStr] = None
    job_role: Optional[str] = Field(None, min_length=3)
    scheduled_datetime: Optional[datetime] = None
    status: Optional[InterviewStatus] = None
    resume_uploaded: Optional[bool] = None
    jd_uploaded: Optional[bool] = None

class QuestionResponse(BaseModel):
    id: str
    question_text: str
    question_type: str
    difficulty: str
    category: str
    expected_answer: str
    scoring_criteria: List[str]
    created_at: datetime

class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    experience_years: int
    skills: List[str]
    resume_url: str
    notes: str
    created_at: datetime

class InterviewResponse(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    job_role: str
    scheduled_datetime: datetime
    status: InterviewStatus
    resume_uploaded: bool
    jd_uploaded: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

class InterviewListResponse(BaseModel):
    interviews: List[InterviewResponse]
    total: int
    page: int
    page_size: int
