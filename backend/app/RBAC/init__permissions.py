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
    {"code": "JOB_POSTING_STATUS_UPDATE", "module": "Job", "description": "Update job posting status"},
    {"code": "JOB_DESCRIPTION_GENERATION", "module": "Job", "description": "Generate job description"},
    {"code": "JOB_POSTING_STATISTICS", "module": "Job", "description": "Show job posting statistics"},
    
    # Resume module
    {"code": "RESUME_UPLOAD", "module": "Resume", "description": "Upload candidate resumes"},
    {"code": "RESUME_SCREENING", "module": "Resume", "description": "Screen and evaluate resumes"},
    {"code": "RESUME_SCREENING_RESULTS", "module": "Resume", "description": "View resume screening results"},
    
    # Interview module
    {"code": "CREATE_INTERVIEW", "module": "Interview", "description": "Create interviews"},
    {"code": "GET_INTERVIEW", "module": "Interview", "description": "Get interview details"},
    {"code": "LIST_INTERVIEWS", "module": "Interview", "description": "List interviews"},
    {"code": "UPDATE_INTERVIEW", "module": "Interview", "description": "Update interview details"},
    {"code": "DELETE_INTERVIEW", "module": "Interview", "description": "Delete interviews"},
    {"code": "BULK_INTERVIEW_SCHEDULE", "module": "Interview", "description": "Schedule bulk interviews"},
    {"code": "GET_INTERVIEWS_BY_JOB_POSTING", "module": "Interview", "description": "View interview details by job posting"},
    {"code": "GET_INTERVIEW_STATISTICS", "module": "Interview", "description": "Get interview statistics for the current user"},

    #Super Admin module
    {"code": "USER_CREATE", "module": "Admin", "description": "Create new users"},
    {"code": "USER_EDIT", "module": "Admin", "description": "Edit existing users"},
    {"code": "USER_DELETE", "module": "Admin", "description": "Delete users"},
    {"code": "VIEW_ALL_USERS", "module": "Admin", "description": "View allusers"},
    {"code": "USER_VIEW", "module": "Admin", "description": "View single user by ID"},
    {"code": "CREATE_ROLE", "module": "Admin", "description": "Create roles and permissions"},
    {"code": "VIEW_ROLES", "module": "Admin", "description": "View roles and permissions"},
   
    
    # Report module
    {"code": "REPORT_GENERATE", "module": "Report", "description": "Generate reports"},
    {"code": "REPORT_VIEW", "module": "Report", "description": "View reports"},
    {"code": "REPORT_DOWNLOAD", "module": "Report", "description": "Download reports"},
    {"code": "LIST_CANDIDATE_REPORTS", "module": "Report", "description": "List candidate reports"},
    {"code": "JOB_POSTING_CANDIDATES_REPORT", "module": "Report", "description": "View candidate report by job posting"},
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

async def create_super_admin_role():
    """
    Create the SUPER_ADMIN role if it doesn't exist.
    Returns the role ObjectId.
    """
  
    db = get_database()
    from app.database import ROLES_COLLECTION
    # Check if SUPER_ADMIN role already exists
    super_admin_role = await db[ROLES_COLLECTION].find_one({"name": "SUPER_ADMIN"})
    
    if super_admin_role:
        logger.info("SUPER_ADMIN role already exists")
        return super_admin_role["_id"]
    
    # Create SUPER_ADMIN role
    role_data = {
        "_id": ObjectId(),
        "name": "SUPER_ADMIN",
        "description": "System owner with full access",
        "is_system": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db[ROLES_COLLECTION].insert_one(role_data)
    logger.info("Created SUPER_ADMIN role")
    
    # Assign all permissions to SUPER_ADMIN
    from app.database import ROLE_PERMISSIONS_COLLECTION
    
    # Get all permissions
    permissions = []
    async for perm in db[PERMISSIONS_COLLECTION].find():
        permissions.append(perm["code"])
    
    # Assign all permissions to SUPER_ADMIN
    for perm_code in permissions:
        await db[ROLE_PERMISSIONS_COLLECTION].insert_one({
            "_id": ObjectId(),
            "role_id": role_data["_id"],
            "permission_code": perm_code,
            "created_at": datetime.now(timezone.utc)
        })
    
    logger.info(f"Assigned {len(permissions)} permissions to SUPER_ADMIN role")
    
    return role_data["_id"]

async def init_rbac():
    """Initialize RBAC system with permissions and SUPER_ADMIN role."""
    await init_permissions()
    #super_admin_role_id = await create_super_admin_role()
    return 