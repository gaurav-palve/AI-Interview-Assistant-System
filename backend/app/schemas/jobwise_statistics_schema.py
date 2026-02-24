from pydantic import BaseModel
from typing import List

class JobTitleResponse(BaseModel):
    job_title: str
    posted_days_ago: int
    number_of_applications: int
    shortlisted: int
    interviewed: int
    status: str