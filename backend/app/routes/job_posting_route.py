from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_database, JOB_POSTINGS_COLLECTION
from app.services.generate_jd_service import generate_jd
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/job-postings", tags=["Job Postings"])

class JobPostingBase(BaseModel):
    # Basic Information
    job_title: str
    company: str
    job_type: str
    work_location_type: str
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
    work_location_type: str
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

class JobPostingUpdate(BaseModel):
    # Basic Information
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_type: Optional[str] = None
    work_location_type: Optional[str] = None
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
    company_description: Optional[str] = None
    job_role: str
    location: Optional[str] = None
    experience: Optional[str] = None
    qualifications: Optional[str] = None
    skills: Optional[str] = None
    additional_context: Optional[str] = None

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

@router.post("")
async def create_job_posting(job_posting: JobPostingCreate):
    """
    Create a new job posting
    """
    try:
        db = get_database()
        
        # Create job posting document
        job_doc = job_posting_dict(job_posting)
        
        # Insert into database
        result = await db[JOB_POSTINGS_COLLECTION].insert_one(job_doc)
        
        # Return the created job posting with ID
        response_data = {
            "id": str(result.inserted_id),
            "job_title": job_doc["job_title"],
            "company": job_doc["company"],
            "job_type": job_doc["job_type"],
            "work_location_type": job_doc["work_location_type"],
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

@router.get("")
async def get_job_postings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
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
            query.update(search_query)
        
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
                **{k: v for k, v in job.items() if k != "_id"},
                "created_at": job.get("created_at", datetime.now(timezone.utc)).isoformat(),
                "updated_at": job.get("updated_at", datetime.now(timezone.utc)).isoformat()
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

@router.get("/{job_id}")
async def get_job_posting(job_id: str):
    """
    Get a specific job posting by ID
    """
    try:
        db = get_database()
        
        # Fetch job posting
        job = await db[JOB_POSTINGS_COLLECTION].find_one({"_id": ObjectId(job_id)})
        
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert ObjectId to string and datetime to ISO format
        return {
            "id": str(job["_id"]),
            **{k: v for k, v in job.items() if k != "_id"},
            "created_at": job.get("created_at", datetime.now(timezone.utc)).isoformat(),
            "updated_at": job.get("updated_at", datetime.now(timezone.utc)).isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting job posting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}")
async def update_job_posting(job_id: str, job_posting: JobPostingUpdate):
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

@router.delete("/{job_id}")
async def delete_job_posting(job_id: str):
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

@router.patch("/{job_id}/status")
async def update_job_posting_status(job_id: str, status_update: JobPostingStatusUpdate):
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
async def generate_job_description(request: JobDescriptionGenerate):
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