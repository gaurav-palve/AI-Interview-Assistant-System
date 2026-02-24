from pydantic import BaseModel
from typing import List

class AssignJobRequest(BaseModel):
    job_id: str
    user_ids: List[str]

class RemoveAssignedUserRequest(BaseModel):
    job_id: str
    user_id: str