from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
import pymongo

from app.database import get_database
from app.utils.auth_dependency import require_permission

router = APIRouter()


class AssignJobRequest(BaseModel):
    job_id: str
    user_ids: List[str]


@router.post("/job-assignments/assign")
async def assign_job_to_users(
    payload: AssignJobRequest,
    current_user: dict = Depends(require_permission("assign_job"))
):
    
    db = get_database()

    # ✅ Validate job
    try:
        job_id = ObjectId(payload.job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job_id")

    job = await db["job_postings"].find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Prepare assignments
    documents = []
    for user_id in payload.user_ids:
        try:
            documents.append({
                "job_id": job_id,
                "user_id": ObjectId(user_id),
                "assigned_by": ObjectId(current_user["_id"]),
                "assigned_at": datetime.now(timezone.utc),
                "status": "active"
            })
        except Exception:
            continue  # skip invalid user_id

    if not documents:
        raise HTTPException(status_code=400, detail="No valid users to assign")

    # Insert with duplicate protection
    try:
        await db["job_assignments"].insert_many(
            documents,
            ordered=False
        )
    except pymongo.errors.BulkWriteError:
        # Duplicate assignments ignored safely
        pass
    except Exception as e:
        raise HTTPException(status_code=500, detail="Assignment failed")

    return {
        "message": "Job assigned successfully",
    }

@router.get("/get-assigned-users-of-job/{job_id}")
async def get_job_assignments_by_job(
    job_id: str,
    current_user: dict = Depends(require_permission("ASSIGN_USERS"))
):
    db = get_database()
    
    try:
        job_object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job_id")
    
    # Get all job assignments for this job
    assignments = await db["job_assignments"].find({"job_id": job_object_id}).to_list(1000)
    
    # Get user details for each assigned user
    user_ids = [assignment["user_id"] for assignment in assignments]
    assigned_users = []
    
    for user_id in user_ids:
        user = await db["users"].find_one({"_id": user_id},{"email":1,"first_name":1,"last_name":1})
       
        if user:
            # Convert ObjectId to string for JSON response
            user["_id"] = str(user["_id"])
            assigned_users.append(user)
            
    
    return {
        "job_id": job_id,
        "assigned_users": assigned_users,
        "total_assigned": len(assigned_users)
    }
