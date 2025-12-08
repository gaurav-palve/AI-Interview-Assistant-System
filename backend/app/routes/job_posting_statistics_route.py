from fastapi import APIRouter, HTTPException
from fastapi import Depends
from openai import BaseModel
from typing import Dict, Any
from app.utils.auth_dependency import require_auth
from app.services.interview_service import InterviewService
from app.services.job_posting_summary_statistics_service import get_interview_statistics
from app.utils.logger import get_logger
logger = get_logger(__name__)
router = APIRouter()

@router.get("/stats/job-posting/{job_posting_id}")
async def get_job_posting_interview_statistics(
    job_posting_id: str,
    current_user: dict = Depends(require_auth)
):
    try:
        admin_id = current_user["admin_id"]

        stats = await get_interview_statistics(
            created_by=admin_id,
            job_posting_id=job_posting_id
        )
        return {
            "message": "Job posting statistics retrieved successfully",
            "data": stats,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Error getting job posting interview statistics for {job_posting_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
