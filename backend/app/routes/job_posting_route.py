from fastapi import APIRouter, HTTPException, Query
from fastapi.params import Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_database, JOB_POSTINGS_COLLECTION
from app.services.generate_jd_service import generate_jd
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.logger import get_logger
from app.utils.auth_dependency import get_current_user


logger = get_logger(__name__)

router = APIRouter( tags=["Job Postings"])

class JobPostingBase(BaseModel):
    # Basic Information
    job_title: str
    company: str
    job_type: str
    work_location: str
    location: str
    experience_level: Optional[str] = None
    department: Optional[str] = None
    
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: bool = True
    
    # Status
    status: str = "draft"  # draft, active, closed, archived

class JobPostingCreate(BaseModel):
    # Basic Information
    job_title: str
    company: str
    job_type: str
    work_location: str
    location: str
    experience_level: Optional[str] = None
    department: Optional[str] = None
    status: str = None
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: bool = True
    
    # Status
    status: str = "draft"  # draft, active, closed, archived

class JobPostingUpdate(BaseModel):
    # Basic Information
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_type: Optional[str] = None
    work_location: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    department: Optional[str] = None
    
    # Skills
    required_skills: List[str] = []
    
    # Requirements & Responsibilities
    requirements: List[str] = []
    responsibilities: List[str] = []
    qualifications: Optional[str] = None
    
    # Job Description
    company_description: Optional[str] = None
    job_description: Optional[str] = None
    use_ai_generation: Optional[bool] = None

class JobPostingStatusUpdate(BaseModel):
    status: str

class JobDescriptionGenerate(BaseModel):
    job_title: str
    company: str
    job_type: str
    work_location: str
    required_skills: Optional[str]
    experience_level: Optional[str]
    responsibilities: Optional[str]
    qualifications: Optional[str]
    additional_context: Optional[str]

def job_posting_dict(job_posting: JobPostingCreate) -> Dict[str, Any]:
    """Convert JobPostingBase to dictionary for database storage"""
    now = datetime.now(timezone.utc)
    return {
        **job_posting.dict(),
        "created_at": now,
        "updated_at": now,
        "ai_generated": job_posting.use_ai_generation,
        "applicants_count": 0,
        "views_count": 0
    }

@router.post("/create_job_posting")
async def create_job_posting(
    job_posting: JobPostingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new job posting
    """
    try:
        db = get_database()
        
        # Create job posting document
        # job_doc = job_posting_dict(job_posting)
        job_doc = job_posting_dict(job_posting)

        job_doc["created_by"] = str(current_user["_id"])

        # Insert into database
        result = await db[JOB_POSTINGS_COLLECTION].insert_one(job_doc)
        
        # Return the created job posting with ID
        response_data = {
            "id": str(result.inserted_id),
            "job_title": job_doc["job_title"],
            "company": job_doc["company"],
            "job_type": job_doc["job_type"],
            "work_location": job_doc["work_location"],
            "location": job_doc["location"],
            "experience_level": job_doc["experience_level"],
            "department": job_doc["department"],
            "required_skills": job_doc["required_skills"],
            "requirements": job_doc["requirements"],
            "responsibilities": job_doc["responsibilities"],
            "qualifications": job_doc["qualifications"],
            "company_description": job_doc["company_description"],
            "job_description": job_doc["job_description"],
            "use_ai_generation": job_doc["use_ai_generation"],
            "status": job_doc["status"],
            "created_at": job_doc["created_at"].isoformat(),
            "updated_at": job_doc["updated_at"].isoformat(),
            "ai_generated": job_doc["ai_generated"],
            "applicants_count": job_doc["applicants_count"],
            "views_count": job_doc["views_count"]
        }
        return response_data
    except Exception as e:
        logger.error(f"Error creating job posting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get_job_postings")
async def get_job_postings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all job postings with optional filters
    """
    try:
        db = get_database()
        
        # Build query
        query = {}
        if status:
            query["status"] = status
        
        if search:
            # Search in multiple fields
            search_query = {
                "$or": [
                    {"job_title": {"$regex": search, "$options": "i"}},
                    {"company": {"$regex": search, "$options": "i"}},
                    {"location": {"$regex": search, "$options": "i"}},
                    {"required_skills": {"$elemMatch": {"$regex": search, "$options": "i"}}},
                    {"job_description": {"$regex": search, "$options": "i"}}
                ]
            }
            query["$or"] = [search_query]
        
        # Determine sort order
        sort_options = {
            "newest": [("created_at", -1)],
            "oldest": [("created_at", 1)],
            "title_asc": [("job_title", 1)],
            "title_desc": [("job_title", -1)]
        }
        sort_order = sort_options.get(sort, sort_options["newest"])
        
        # Fetch job postings
        cursor = db[JOB_POSTINGS_COLLECTION].find(query).sort(sort_order).skip(skip).limit(limit)
        job_postings = await cursor.to_list(length=limit)
        
        # Get total count for pagination
        total_count = await db[JOB_POSTINGS_COLLECTION].count_documents(query)
        
        # Convert ObjectId to string and datetime to ISO format
        result = []
        for job in job_postings:
            result.append({
                "id": str(job["_id"]),
                "job_title": job.get("job_title"),
                "company": job.get("company"),
                "job_type": job.get("job_type"),
                "work_location": job.get("work_location"),
                "location": job.get("location"),
                "experience_level": job.get("experience_level"),
                "department": job.get("department"),
                "required_skills": job.get("required_skills", []),
                "requirements": job.get("requirements", []),
                "responsibilities": job.get("responsibilities", []),
                "qualifications": job.get("qualifications"),
                "company_description": job.get("company_description"),
                "job_description": job.get("job_description"),
                "status": job.get("status"),
                "created_by": str(job.get("created_by")) if job.get("created_by") else None,
                "created_at": job.get("created_at", datetime.now(timezone.utc)).isoformat(),
                "updated_at": job.get("updated_at", datetime.now(timezone.utc)).isoformat(),
                "applicants_count": job.get("applicants_count", 0),
                "views_count": job.get("views_count", 0)
            })
        
        return {
            "job_postings": result,
            "total": total_count,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error listing job postings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get_job_posting_by_id/{job_id}")
async def get_job_posting(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a specific job posting by ID
    """
    try:
        db = get_database()
        
        # Fetch job posting
        job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert ObjectId to string and datetime to ISO format
    return {
    "id": str(job["_id"]),
    "job_title": job.get("job_title"),
    "company": job.get("company"),
    "job_type": job.get("job_type"),
    "work_location": job.get("work_location"),
    "location": job.get("location"),
    "experience_level": job.get("experience_level"),
    "department": job.get("department"),
    "required_skills": job.get("required_skills", []),
    "requirements": job.get("requirements", []),
    "responsibilities": job.get("responsibilities", []),
    "qualifications": job.get("qualifications"),
    "company_description": job.get("company_description"),
    "job_description": job.get("job_description"),
    "status": job.get("status"),
    "created_by": str(job.get("created_by")) if job.get("created_by") else None,
    "created_at": job.get("created_at", datetime.now(timezone.utc)).isoformat(),
    "updated_at": job.get("updated_at", datetime.now(timezone.utc)).isoformat(),
    "applicants_count": job.get("applicants_count", 0),
    "views_count": job.get("views_count", 0)
}

@router.put("/update_job_posting/{job_id}")
async def update_job_posting(
    job_id: str,
    job_posting: JobPostingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a job posting
    """
    try:
        db = get_database()
        
        # Check if job posting exists
        existing_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        if not existing_job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Update job posting
        now = datetime.now(timezone.utc)
        update_data = {
            **job_posting.dict(),
            "updated_at": now,
            "ai_generated": job_posting.use_ai_generation
        }
        
        await db[JOB_POSTINGS_COLLECTION].update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )
        
        # Return updated job posting
        updated_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        
        return {
            "id": str(updated_job["_id"]),
            **{k: v for k, v in updated_job.items() if k != "_id"},
            "created_at": updated_job.get("created_at", datetime.now(timezone.utc)).isoformat(),
            "updated_at": updated_job.get("updated_at", datetime.now(timezone.utc)).isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating job posting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete_job_posting/{job_id}")
async def delete_job_posting(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a job posting
    """
    try:
        db = get_database()
        
        # Check if job posting exists
        existing_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        if not existing_job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Delete job posting
        result = await db[JOB_POSTINGS_COLLECTION].delete_one({"_id": ObjectId(job_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        return {"message": "Job posting deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting job posting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/update-job-posting-status/{job_id}")
async def update_job_posting_status(
    job_id: str,
    status_update: JobPostingStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the status of a job posting
    """
    try:
        db = get_database()
        
        # Check if job posting exists
        existing_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        if not existing_job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Validate status
        valid_statuses = ["draft", "active", "closed", "archived"]
        if status_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        # Update status
        now = datetime.now(timezone.utc)
        await db[JOB_POSTINGS_COLLECTION].update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": status_update.status, "updated_at": now}}
        )
        
        # Return updated job posting
        updated_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        
        return {
            "id": str(updated_job["_id"]),
            **{k: v for k, v in updated_job.items() if k != "_id"},
            "created_at": updated_job.get("created_at", datetime.now(timezone.utc)).isoformat(),
            "updated_at": updated_job.get("updated_at", datetime.now(timezone.utc)).isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating job posting status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-description")
async def generate_job_description(
    request: JobDescriptionGenerate,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a job description based on the provided requirements
    """
    try:
        requirements = request.dict()
        jd_text = generate_jd(requirements)
        return {"job_description": jd_text}
    except Exception as e:
        logger.error(f"Error generating job description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/job-description/{job_id}")
async def update_job_description(
    job_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update ONLY the job description field, safely.
    """
    try:
        db = get_database()

        # Validate incoming payload
        if "job_description" not in data:
            raise HTTPException(status_code=400, detail="job_description is required")

        new_jd = data["job_description"]

        # Update only the job_description
        await db[JOB_POSTINGS_COLLECTION].update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "job_description": new_jd,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        # Fetch updated job posting
        updated_job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})

        return {
            "id": str(updated_job["_id"]),
            **{k: v for k, v in updated_job.items() if k != "_id"},
            "created_at": updated_job.get("created_at").isoformat(),
            "updated_at": updated_job.get("updated_at").isoformat()
        }

    except Exception as e:
        logger.error(f"Error updating job description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
