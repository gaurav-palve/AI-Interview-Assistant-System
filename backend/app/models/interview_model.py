from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum

class InterviewStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    CODING = "coding"
    SYSTEM_DESIGN = "system_design"
    GENERAL = "general"

def interview_dict(
    title: str,
    description: str,
    interview_type: InterviewType,
    duration_minutes: int,
    created_by: str,
    questions: List[Dict[str, Any]] = None,
    candidate_info: Dict[str, Any] = None,
    scheduled_time: Optional[datetime] = None,
    status: InterviewStatus = InterviewStatus.DRAFT
):
    """Create an interview document"""
    return {
        "title": title,
        "description": description,
        "interview_type": interview_type,
        "duration_minutes": duration_minutes,
        "questions": questions or [],
        "candidate_info": candidate_info or {},
        "scheduled_time": scheduled_time,
        "status": status,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "metadata": {
            "total_questions": len(questions) if questions else 0,
            "estimated_difficulty": "medium"
        }
    }

def question_dict(
    question_text: str,
    question_type: str,
    difficulty: str = "medium",
    category: str = "general",
    expected_answer: str = "",
    scoring_criteria: List[str] = None
):
    """Create a question document"""
    return {
        "question_text": question_text,
        "question_type": question_type,
        "difficulty": difficulty,
        "category": category,
        "expected_answer": expected_answer,
        "scoring_criteria": scoring_criteria or [],
        "created_at": datetime.now(timezone.utc)
    }

def candidate_dict(
    name: str,
    email: str,
    phone: str = "",
    experience_years: int = 0,
    skills: List[str] = None,
    resume_url: str = "",
    notes: str = ""
):
    """Create a candidate document"""
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "experience_years": experience_years,
        "skills": skills or [],
        "resume_url": resume_url,
        "notes": notes,
        "created_at": datetime.now(timezone.utc)
    }
