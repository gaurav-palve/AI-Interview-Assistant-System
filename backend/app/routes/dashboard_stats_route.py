from fastapi import APIRouter, Depends, HTTPException
from app.database import get_database, JOB_POSTINGS_COLLECTION, USERS_COLLECTION, ROLES_COLLECTION
from app.utils.auth_dependency import get_current_user
from app.utils.logger import get_logger
import logging
router = APIRouter(tags=["Dashboard Statistics"])

logger = get_logger(__name__)

@router.get("/job-statistics")
async def get_job_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get job posting statistics (status-wise counts)
    """
    try:
        db = get_database()

        # Aggregate counts by status
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]

        cursor = db[JOB_POSTINGS_COLLECTION].aggregate(pipeline)
        results = await cursor.to_list(length=None)

        # Default counts
        stats = {
            "total": 0,
            "active": 0,
            "draft": 0,
            "closed": 0,
            "archived": 0
        }

        total = 0
        for item in results:
            status = item["_id"]
            count = item["count"]
            total += count

            if status in stats:
                stats[status] = count

        stats["total"] = total

        return stats

    except Exception as e:
        logger.error(f"Error fetching job statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job statistics")
    

@router.get("/user-role-statistics")
async def get_user_role_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get total users, total roles, and role-wise user counts
    """
    try:
        db = get_database()

        # Total users
        total_users = await db[USERS_COLLECTION].count_documents({})

        # Total roles
        total_roles = await db[ROLES_COLLECTION].count_documents({})

        # Role-wise user count (dynamic)
        pipeline = [
            {
                "$addFields": {
                    "role_obj_id": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$role_id"}, "string"]},
                            "then": {"$toObjectId": "$role_id"},
                            "else": "$role_id"
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$role_obj_id",
                    "count": {"$sum": 1}
                }
            },
            {
                "$lookup": {
                    "from": ROLES_COLLECTION,
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "role"
                }
            },
            {
                "$unwind": {
                    "path": "$role",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "role_id": {"$toString": "$_id"},
                    "role_name": {
                        "$ifNull": ["$role.name", "$role.role_name"]
                    },
                    "count": 1
                }
            }
        ]

        cursor = db[USERS_COLLECTION].aggregate(pipeline)
        role_wise_users = await cursor.to_list(length=None)

        return {
            "total_users": total_users,
            "total_roles": total_roles,
            "role_wise_users": role_wise_users
        }

    except Exception as e:
        logger.error(f"Error fetching user-role statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user-role statistics")
