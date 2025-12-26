from fastapi import APIRouter, Depends
from fastapi import HTTPException
from app.utils.logger import get_logger
from app.utils.auth_dependency import get_current_user
logger = get_logger(__name__)

from typing import List
from app.database import JOB_POSTINGS_COLLECTION, SCHEDULED_INTERVIEWS_COLLECTION
from typing import List, Dict
from datetime import datetime, timezone
from app.database import get_database
from pydantic import BaseModel
from bson import ObjectId


router = APIRouter()

class JobTitleResponse(BaseModel):
    job_title: str
    posted_days_ago: int
    number_of_applications: int
    shortlisted: int
    interviewed: int
    status: str

async def get_all_job_titles():
    db = get_database()
    now = datetime.now(timezone.utc)

    cursor = db[JOB_POSTINGS_COLLECTION].find(
        {},
        {
            "_id": 1,
            "job_title": 1,
            "created_at": 1,
            "number_of_applications": 1,
            "status": 1
        }
    )

    results = []

    async for doc in cursor:
        # Posted days ago
        posted_days_ago = 0
        created_at = doc.get("created_at")
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            today_date = datetime.now(timezone.utc).date()
            created_date = created_at.date()

            posted_days_ago = (today_date - created_date).days

        # Applications count
        applications_count = doc.get("number_of_applications", 0)

        # Interviewed (completed)
        interviewed_count = await db[SCHEDULED_INTERVIEWS_COLLECTION].count_documents(
            {
                "job_posting_id": str(doc["_id"]),
                "status": "completed"
            }
        )

        results.append({
            "id": str(doc["_id"]),
            "job_title": doc.get("job_title"),
            "posted_days_ago": posted_days_ago,
            "number_of_applications": applications_count,
            "shortlisted": 0,  # placeholder
            "interviewed": interviewed_count,
            "status": doc.get("status")
        })

    return results


@router.get("/jobwise-statistics", response_model=List[JobTitleResponse])
async def jobwise_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint to get all job titles from job postings.
    Requires authentication.
    """
    try:
        job_titles = await get_all_job_titles()
        return job_titles
    except Exception as e:
        logger.exception(f"Error fetching job titles: {str(e)}")
