from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Define models
class CandidateInfo(BaseModel):
    name: str
    email: str
    resume: str

class AttachmentInfo(BaseModel):
    filename: str
    content: str  # Base64 encoded content
    content_type: str

class BulkInterviewScheduleRequest(BaseModel):
    job_posting_id: str
    interview_datetime: str
    candidates: List[CandidateInfo]
    job_description: str
    attachments: Optional[List[AttachmentInfo]] = []