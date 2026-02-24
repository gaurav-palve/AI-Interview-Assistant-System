from pydantic import BaseModel
from typing import List, Optional

class JobPostingBase(BaseModel):
    # Basic Information
    job_title: str
    company: str
    job_type: str
    work_location: str
    location: str
    experience_level: Optional[str] = None
    department: Optional[str] = None
    
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: bool = True
    
    # Status
    status: str = "draft"  # draft, active, closed, archived

class JobPostingCreate(BaseModel):
    # Basic Information
    job_title: str
    company: str
    job_type: str
    work_location: str
    location: str
    experience_level: Optional[str] = None
    experience: Optional[dict] = None  # Add this line to include the raw experience data
    department: Optional[str] = None
    status: str = None
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: bool = True
    
    # Status
    status: str = "draft"  # draft, active, closed, archived

class JobPostingUpdate(BaseModel):
    # Basic Information
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_type: Optional[str] = None
    work_location: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    department: Optional[str] = None
    
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: Optional[bool] = None

class JobPostingStatusUpdate(BaseModel):
    status: str
class JobDescriptionGenerate(BaseModel):
    job_title: str
    company: str
    job_type: str
    work_location: str
    required_skills: Optional[str]
    experience_level: Optional[str]
    experience: Optional[dict] = None  # Add this line to accept the raw experience data
    responsibilities: Optional[str]
    qualifications: Optional[str]
    additional_context: Optional[str]
    additional_context: Optional[str]