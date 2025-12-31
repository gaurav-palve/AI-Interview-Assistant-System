from datetime import datetime, timezone
from app.database import get_database, PERMISSIONS_COLLECTION
import logging

logger = logging.getLogger(__name__)

SYSTEM_PERMISSIONS = [
    # Job module
    {"code": "JOB_CREATE", "module": "Job", "description": "Create new job postings"},
    {"code": "JOB_EDIT", "module": "Job", "description": "Edit existing jobs"},
    {"code": "JOB_DELETE", "module": "Job", "description": "Delete jobs"},
    {"code": "JOB_VIEW", "module": "Job", "description": "View your jobs"},
    {"code": "JOB_VIEW_ALL", "module": "Job", "description": "View all jobs"},
    {"code": "JOB_POSTING_STATUS_UPDATE", "module": "Job", "description": "Change job status"},
    {"code": "JOB_DESCRIPTION_GENERATION", "module": "Job", "description": "Generate job descriptions automatically"},
    {"code": "JOB_POSTING_STATISTICS", "module": "Job", "description": "See job statistics"},
    
    # Resume module
    {"code": "RESUME_UPLOAD", "module": "Resume", "description": "Upload candidate resumes"},
    {"code": "RESUME_SCREENING", "module": "Resume", "description": "Screen and evaluate resumes"},
    {"code": "RESUME_SCREENING_RESULTS", "module": "Resume", "description": "View screening results"},
    
    # Interview module
    {"code": "INTERVIEW_SCHEDULE", "module": "Interview", "description": "Schedule interviews"},
    {"code": "INTERVIEW_MANAGE", "module": "Interview", "description": "Manage interviews"},
    {"code": "INTERVIEW_VIEW", "module": "Interview", "description": "View interview details"},
    
    # Admin module
    {"code": "ROLE_MANAGE", "module": "Admin", "description": "Manage roles and permissions"},
    {"code": "ROLE_VIEW", "module": "Admin", "description": "View all roles"},
    {"code": "USER_MANAGE", "module": "Admin", "description": "Create and manage users"},
    {"code": "USER_VIEW", "module": "Admin", "description": "View users"},
    
    # Assessment module
    {"code": "ASSESSMENT_VIEW", "module": "Assessment", "description": "View assessment results"},
    {"code": "ASSESSMENT_CREATE", "module": "Assessment", "description": "Create assessments"},
    
    # Report module
    {"code": "REPORT_GENERATE", "module": "Report", "description": "Generate reports"},
    {"code": "REPORT_VIEW", "module": "Report", "description": "View reports"},
    {"code": "REPORT_DOWNLOAD", "module": "Report", "description": "Download reports"},
    {"code": "LIST_CANDIDATE_REPORTS", "module": "Report", "description": "List reports of all candidates"},
    {"code": "JOB_POSTING_CANDIDATES_REPORT", "module": "Report", "description": "View candidate report by job"},
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
