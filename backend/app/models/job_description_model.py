from datetime import datetime, timezone
from typing import Dict, Optional, List
from pydantic import BaseModel, Field

class JobDescriptionBase(BaseModel):
    """Base model for job description data"""
    company_description: str
    job_role: str
    location: str
    experience: str
    qualifications: str
    skills: str
    
class JobDescriptionCreate(JobDescriptionBase):
    """Model for creating a job description"""
    pass

class JobDescriptionInDB(JobDescriptionBase):
    """Model for job description stored in database"""
    id: str
    generated_description: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
def job_description_dict(
    company_description: str,
    job_role: str,
    location: str,
    experience: str,
    qualifications: str,
    skills: str,
    generated_description: str
) -> Dict:
    """
    Create a dictionary for a job description document to be stored in MongoDB
    
    Args:
        company_description: Description of the company
        job_role: Job role/title
        experience: Required experience
        qualifications: Required qualifications
        skills: Required skills
        generated_description: The generated job description text
        
    Returns:
        Dictionary representing a job description document
    """
    now = datetime.now(timezone.utc)
    return {
        "company_description": company_description,
        "job_role": job_role,
        "location": location,
        "experience": experience,
        "qualifications": qualifications,
        "skills": skills,
        "generated_description": generated_description,
        "created_at": now,
        "updated_at": now
    }