from datetime import datetime, timezone
from app.database import get_database, PERMISSIONS_COLLECTION
import logging
from bson import ObjectId

    
logger = logging.getLogger(__name__)

# Define all system permissions
SYSTEM_PERMISSIONS = [
    # Job module
    {"code": "JOB_CREATE", "module": "Job", "description": "Create new job postings"},
    {"code": "JOB_EDIT", "module": "Job", "description": "Edit existing job postings"},
    {"code": "JOB_DELETE", "module": "Job", "description": "Delete job postings"},
    {"code": "JOB_VIEW", "module": "Job", "description": "View job postings"},
    {"code": "JOB_VIEW_ALL", "module": "Job", "description": "View all job postings"},
    {"code": "JOB_VIEW_ASSIGNED", "module": "Job", "description": "View only assigned job postings"},
    {"code": "JOB_POSTING_STATUS", "module": "Job", "description": "Update job posting status"},
    {"code": "UPDATE_JOB_DESCRIPTION", "module": "Job", "description": "Update job description"},
    
    # Resume module
    {"code": "RESUME_UPLOAD", "module": "Resume", "description": "Upload candidate resumes"},
    {"code": "RESUME_SCREEN", "module": "Resume", "description": "Screen and evaluate resumes"},
    {"code": "RESUME_SCREENING_RESULT", "module": "Resume", "description": "Resume screening result"},
    # {"code": "DUPLICATE_VIEW", "module": "Resume", "description": "View duplicate resumes"},
    # {"code": "RESUME_VIEW", "module": "Resume", "description": "View candidate resumes"},
    
    # Interview module
    {"code": "INTERVIEW_SCHEDULE", "module": "Interview", "description": "Schedule interviews"},
    {"code": "INTERVIEW_MANAGE", "module": "Interview", "description": "Manage Interviews"},
    {"code": "INTERVIEW_VIEW", "module": "Interview", "description": "View interview details"},
    
    # Admin module
    {"code": "ROLE_MANAGE", "module": "Admin", "description": "Manage roles and permissions"},
    {"code": "ROLE_VIEW", "module": "Admin", "description": "View roles and permissions"},
    {"code": "USER_MANAGE", "module": "Admin", "description": "Create users"},
    {"code": "USER_VIEW", "module": "Admin", "description": "View users"},
    
    # Assessment module
    {"code": "ASSESSMENT_VIEW", "module": "Assessment", "description": "View assessment results"},
    {"code": "ASSESSMENT_CREATE", "module": "Assessment", "description": "Create assessments"},
    
    # Report module
    {"code": "REPORT_GENERATE", "module": "Report", "description": "Generate reports"},
    {"code": "REPORT_VIEW", "module": "Report", "description": "View reports"},
    {"code": "REPORT_DOWNLOAD", "module": "Report", "description": "Download reports"},
]

async def init_permissions():
    """Initialize all system permissions in the database."""
    db = get_database()
    
    # Get existing permissions
    existing_permissions = []
    async for perm in db[PERMISSIONS_COLLECTION].find({}, {"code": 1}):
        existing_permissions.append(perm["code"])
    
    # Insert new permissions
    for permission in SYSTEM_PERMISSIONS:
        if permission["code"] not in existing_permissions:
            permission["created_at"] = datetime.now(timezone.utc)
            await db[PERMISSIONS_COLLECTION].insert_one(permission)
            logger.info(f"Added permission: {permission['code']}")
        else:
            logger.debug(f"Permission already exists: {permission['code']}")
    
    logger.info("Permission initialization complete.")



async def init_rbac():
    """Initialize RBAC system with permissions and SUPER_ADMIN role."""
    await init_permissions()
    return 