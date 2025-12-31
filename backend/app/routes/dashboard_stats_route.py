from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_database, JOB_POSTINGS_COLLECTION, USERS_COLLECTION, ROLES_COLLECTION, SCHEDULED_INTERVIEWS_COLLECTION
from app.utils.auth_dependency import get_current_user,require_permission
from app.utils.logger import get_logger
import logging
router = APIRouter(tags=["Dashboard Statistics"])

logger = get_logger(__name__)

from bson import ObjectId


@router.get("/get-job-statistics")
async def get_job_statistics(
    current_user: dict = Depends(require_permission("JOB_VIEW"))
):
    """
    Get job posting statistics (status-wise counts)

    SUPER_ADMIN → all jobs
    Others → jobs created by logged-in user
    """
    try:
        db = get_database()

        # Fetch role
        role_doc = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(current_user.get("role_id"))},
            {"role_name": 1}
        )

        if not role_doc:
            raise HTTPException(status_code=403, detail="Invalid role")

        # Build match query
        if role_doc.get("role_name") == "SUPER_ADMIN":
            match_query = {}
        else:
            match_query = {
                "created_by": str(current_user.get("_id"))
            }

        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]

        results = await db[JOB_POSTINGS_COLLECTION].aggregate(pipeline).to_list(None)

        # Initialize stats
        stats = {
            "total": 0,
            "active": 0,
            "draft": 0,
            "closed": 0,
            "archived": 0
        }
        for item in results:
            raw_status = item["_id"]
            count = item["count"]

            # Always update total
            stats["total"] += count

            # Normalize status
            if raw_status:
                status = raw_status.lower()
                if status in stats:
                    stats[status] = count

        return stats

    except Exception as e:
        logger.error(f"Error fetching job statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch job statistics"
        )


@router.get("/user-role-statistics")
async def get_user_role_statistics(
    current_user: dict = Depends(require_permission("USER_VIEW"))
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
    

@router.get("/get-roles-stats")
async def get_roles_statistics(
    current_user: dict = Depends(require_permission("ROLE_VIEW"))
):
    """
    Returns:
    - total_roles
    - role-wise count
    """
    try:
        db = get_database()

        # Fetch logged-in user's role
        role_doc = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(current_user.get("role_id"))}
        )

        if not role_doc:
            raise HTTPException(status_code=403, detail="Invalid role")

        # SUPER_ADMIN can view all roles
        if role_doc.get("role_name") == "SUPER_ADMIN":
            match_query = {}
        else:
            match_query = {
                "created_by": current_user.get("email")
            }

        # ✅ FIXED aggregation pipeline
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": "$role_name",   # 🔥 FIX HERE
                    "count": {"$sum": 1}
                }
            }
        ]

        roles = []
        total_roles = 0

        async for r in db[ROLES_COLLECTION].aggregate(pipeline):
            normalized_role = (
                r["_id"]
                .replace("_", " ")
                .upper()
                .strip()
            )
            roles.append({
                "role": normalized_role,
                "count": r["count"]
            })
            total_roles += r["count"]

        return {
            "total_roles": total_roles,
            "roles": roles
        }

    except Exception as e:
        logger.error(f"Error fetching role statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch role statistics"
        )
    



@router.get("/get-users-stats")
async def get_users_statistics(
    current_user: dict = Depends(require_permission("USER_VIEW"))
):
    """
    Returns:
    - total_users
    - active_users
    - inactive_users
    """
    try:
        db = get_database()

        # Fetch logged-in user's role
        role_doc = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(current_user.get("role_id"))},
            {"role_name": 1}
        )

        if not role_doc:
            raise HTTPException(status_code=403, detail="Invalid role")

        # SUPER_ADMIN → all users
        if role_doc.get("role_name") == "SUPER_ADMIN":
            match_query = {}
        else:
            match_query = {
                "created_by": current_user.get("email")
            }

        # Aggregation pipeline
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": "$is_active",
                    "count": {"$sum": 1}
                }
            }
        ]

        total_users = 0
        active_users = 0
        inactive_users = 0

        async for r in db[USERS_COLLECTION].aggregate(pipeline):
            total_users += r["count"]

            if r["_id"] is True:
                active_users = r["count"]
            elif r["_id"] is False:
                inactive_users = r["count"]


        data = {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users
        }

        return data
    
    except Exception as e:
        logger.error(f"Error fetching user statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user statistics"
        )



@router.get("/get-interviews-stats")
async def get_interviews_statistics(
    current_user: dict = Depends(require_permission("INTERVIEW_VIEW"))
):
    """
    Returns:
    - total_interviews
    - scheduled_count
    - completed_count
    - draft_count

    SUPER_ADMIN → all interviews
    Others → interviews created by logged-in user
    """
    try:
        db = get_database()

        # Fetch logged-in user's role
        role_doc = await db[ROLES_COLLECTION].find_one(
            {"_id": ObjectId(current_user.get("role_id"))},
            {"role_name": 1}
        )

        if not role_doc:
            raise HTTPException(status_code=403, detail="Invalid role")

        # Build match query
        if role_doc.get("role_name") == "SUPER_ADMIN":
            match_query = {}
        else:
            match_query = {
                "created_by": str(current_user.get("_id"))
            }

        # Aggregation pipeline
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": None,
                    "total_interviews": {"$sum": 1},
                    "scheduled_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "scheduled"]}, 1, 0]
                        }
                    },
                    "completed_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "completed"]}, 1, 0]
                        }
                    },
                    "draft_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "draft"]}, 1, 0]
                        }
                    },
                    "in_progress_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]
                        }
                    }
                }
            }
        ]

        result = {
            "total_interviews": 0,
            "scheduled_count": 0,
            "in_progress_count": 0,
            "completed_count": 0,
            "draft_count": 0
        }

        async for r in db[SCHEDULED_INTERVIEWS_COLLECTION].aggregate(pipeline):
            result = {
                "total_interviews": r.get("total_interviews", 0),
                "scheduled_count": r.get("scheduled_count", 0),
                "in_progress_count": r.get("in_progress_count", 0),
                "completed_count": r.get("completed_count", 0),
                "draft_count": r.get("draft_count", 0)
            }
        return result

    except Exception as e:
        logger.error(f"Error fetching interview statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch interview statistics"
        )



