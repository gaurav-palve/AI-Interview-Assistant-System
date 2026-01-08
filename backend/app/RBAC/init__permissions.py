from datetime import datetime, timezone
from app.database import get_database, PERMISSIONS_COLLECTION
import logging

logger = logging.getLogger(__name__)

SYSTEM_PERMISSIONS = [
    # Job module
    {"code": "JOB_CREATE", "module": "Job", "description": "Create Job Postings"},
    {"code": "JOB_EDIT", "module": "Job", "description": "Edit Job Postings"},
    {"code": "JOB_DELETE", "module": "Job", "description": "Delete Job Postings"},
    {"code": "JOB_VIEW", "module": "Job", "description": "View Job Postings"},
    {"code": "JOB_POSTING_STATUS_UPDATE", "module": "Job", "description": "Change Job Postings status"},
    
    # Resume module
    {"code": "RESUME_UPLOAD", "module": "Resume", "description": "Upload Resumes"},
    {"code": "RESUME_SCREENING", "module": "Resume", "description": "Resume Screening"},
    {"code": "RESUME_SCREENING_RESULTS", "module": "Resume", "description": "View Screening Results"},
    
    # Interview module
    {"code": "INTERVIEW_SCHEDULE", "module": "Interview", "description": "Schedule Interviews"},
    {"code": "INTERVIEW_MANAGE", "module": "Interview", "description": "Manage Interviews"},
    {"code": "INTERVIEW_VIEW", "module": "Interview", "description": "View Interview Details"},
    
    # Admin module
    {"code": "ROLE_MANAGE", "module": "Admin", "description": "Manage Roles And Permissions"},
    {"code": "ROLE_VIEW", "module": "Admin", "description": "View Roles"},
    {"code": "USER_MANAGE", "module": "Admin", "description": "Create And Manage Users"},
    {"code": "USER_VIEW", "module": "Admin", "description": "View Users"},

    # Report module
    {"code": "REPORT_VIEW", "module": "Report", "description": "View Reports"},


    ## Job Mapping module
    {"code": "MAP_USERS_TO_JOBS", "module": "Job Mapping", "description": "Map Users to Jobs"},
    {"code": "REMOVE_MAPPED_USER_FROM_JOB", "module": "Job Mapping", "description": "Remove Mapped Users from Jobs"},
    {"code": "VIEW_MAPPED_USERS_FOR_JOBS", "module": "Job Mapping", "description": "View Mapped Users of Jobs"},
]


async def init_permissions():
    """Sync system permissions with the database."""
    db = get_database()
    
    # Fetch all existing permission codes
    existing_permissions = {}
    async for perm in db[PERMISSIONS_COLLECTION].find({}):
        existing_permissions[perm["code"]] = perm["_id"]
    
    system_codes = {perm["code"] for perm in SYSTEM_PERMISSIONS}

    # 1. Add new permissions
    for permission in SYSTEM_PERMISSIONS:
        if permission["code"] not in existing_permissions:
            permission["created_at"] = datetime.now(timezone.utc)
            await db[PERMISSIONS_COLLECTION].insert_one(permission)
            logger.info(f"Added permission: {permission['code']}")
        else:
            logger.debug(f"Permission already exists: {permission['code']}")

    # 2. Remove permissions that are no longer in SYSTEM_PERMISSIONS
    for code, _id in existing_permissions.items():
        if code not in system_codes:
            await db[PERMISSIONS_COLLECTION].delete_one({"_id": _id})
            logger.info(f"Removed permission: {code}")

    logger.info("Permission synchronization complete.")

async def init_rbac():
    """Initialize RBAC system with permissions and SUPER_ADMIN role."""
    await init_permissions()
    return
