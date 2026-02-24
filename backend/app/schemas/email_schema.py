from pydantic import BaseModel, EmailStr
from typing import Optional

class EmailConfirmationRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str

class CustomEmailConfirmationRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str
    custom_body: str
class EmailReminderRequest(BaseModel):
    candidate_email: EmailStr
    candidate_name: str
    job_role: str
    scheduled_datetime: str
    interview_id: str

class TestEmailRequest(BaseModel):
    test_email: EmailStr