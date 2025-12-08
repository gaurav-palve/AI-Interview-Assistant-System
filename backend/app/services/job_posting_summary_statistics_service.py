from typing import Dict, Any
from pydantic import BaseModel
from ..database import get_database, SCHEDULED_INTERVIEWS_COLLECTION
from ..models.interview_model import interview_dict
import logging

logger = logging.getLogger(__name__)

async def get_interview_statistics(created_by: str, job_posting_id: str) -> Dict[str, Any]:
    """Get interview statistics for a specific job posting created by a user"""
    try:
        db = get_database()
       
        # 1️⃣ Fetch all interviews matching admin + job posting (MUST convert cursor to list)
        cursor = db[SCHEDULED_INTERVIEWS_COLLECTION].find(
            {
                "created_by": str(created_by),
                "job_posting_id": str(job_posting_id)
            }
        )

        interviews = await cursor.to_list(length=None)

        # 2️⃣ Count each status manually
        status_breakdown = {}
        for interview in interviews:
            status = interview.get("status", "unknown")
            status_breakdown[status] = status_breakdown.get(status, 0) + 1

        # 3️⃣ Total number of interviews
        total_interviews = len(interviews)

        # 4️⃣ Extract specific status counts
        scheduled_count = status_breakdown.get("scheduled", 0)
        completed_count = status_breakdown.get("completed", 0)
        draft_count = status_breakdown.get("draft", 0)

        # 5️⃣ Return final response
        return {
            "total_interviews": total_interviews,
            "scheduled_count": scheduled_count,
            "completed_count": completed_count,
            "draft_count": draft_count,
            "status_breakdown": status_breakdown
        }

    except Exception as e:
        logger.error(
            f"Error getting interview statistics for {created_by}, Job {job_posting_id}: {e}"
        )
        raise
