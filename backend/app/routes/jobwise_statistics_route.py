from fastapi import APIRouter, Depends
from fastapi import HTTPException
from app.utils.logger import get_logger
from app.utils.auth_dependency import get_current_user
logger = get_logger(__name__)

from typing import List
from app.database import JOB_POSTINGS_COLLECTION, SCHEDULED_INTERVIEWS_COLLECTION, ROLES_COLLECTION, get_database
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

@router.get("/jobwise-statistics", response_model=List[JobTitleResponse])
async def jobwise_statistics(
    current_user: dict = Depends(get_current_user)
):
    try:
        db = get_database()
        user_id = ObjectId(current_user["_id"])
        now = datetime.now(timezone.utc)

        # -------------------------
        # FETCH ROLE
        # -------------------------
        role_doc = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(current_user.get("role_id"))},
            {"role_name": 1}
        )

        if not role_doc:
            raise HTTPException(status_code=403, detail="Invalid role")

        # -------------------------
        # BASE QUERY (SAME AS /get_job_postings)
        # -------------------------
        if role_doc["role_name"] == "SUPER_ADMIN":
            query = {}
        else:
            assignments = await db["job_assignments"].find(
                {
                    "user_id": user_id,
                    "status": "active"
                },
                {"job_id": 1}
            ).to_list(length=None)

            assigned_job_ids = [a["job_id"] for a in assignments]

            query = {
                "$or": [
                    {"created_by": str(user_id)},
                    {"_id": {"$in": assigned_job_ids}}
                ]
            }

        # -------------------------
        # FETCH JOBS
        # -------------------------
        cursor = db[JOB_POSTINGS_COLLECTION].find(
            query,
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

                posted_days_ago = (now.date() - created_at.date()).days

            # Applications count
            applications_count = doc.get("number_of_applications", 0)

            # Interviewed count
            interviewed_count = await db[SCHEDULED_INTERVIEWS_COLLECTION].count_documents(
                {
                    "job_posting_id": str(doc["_id"]),
                    "status": "completed"
                }
            )

            results.append({
                "job_title": doc.get("job_title"),
                "posted_days_ago": posted_days_ago,
                "number_of_applications": applications_count,
                "shortlisted": 0,  # placeholder
                "interviewed": interviewed_count,
                "status": doc.get("status")
            })

        return results

    except Exception as e:
        logger.exception(f"Error fetching jobwise statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch jobwise statistics"
        )
