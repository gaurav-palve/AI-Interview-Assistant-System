from pydantic import BaseModel
from typing import Optional

class JDRequest(BaseModel):
    company_description: Optional[str] = ""
    job_role: Optional[str] = ""
    location: Optional[str] = ""
    experience: Optional[str] = ""
    qualifications: Optional[str] = ""
    skills: Optional[str] = ""
    generated_description: Optional[str] = ""