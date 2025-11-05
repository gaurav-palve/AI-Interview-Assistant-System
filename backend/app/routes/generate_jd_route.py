from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.generate_jd_service import generate_jd
from app.database import get_database, JOB_DESCRIPTIONS_COLLECTION
from app.models.job_description_model import job_description_dict
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Job Descriptions"])

class JDRequest(BaseModel):
    company_description: Optional[str] = ""
    job_role: Optional[str] = ""
    location: Optional[str] = ""
    experience: Optional[str] = ""
    qualifications: Optional[str] = ""
    skills: Optional[str] = ""
    generated_description: Optional[str] = ""

@router.post("/generate")
async def generate_job_description(request: JDRequest):
    """
    Generate a job description based on the provided requirements
    """
    try:
        requirements = request.dict()
        jd_text = generate_jd(requirements)
        return {"job_description": jd_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_job_description(request: JDRequest):
    """
    Save a generated job description to the database
    """
    try:
        db = get_database()
        
        # Create job description document
        jd_doc = job_description_dict(
            company_description=request.company_description,
            job_role=request.job_role,
            location=request.location,
            experience=request.experience,
            qualifications=request.qualifications,
            skills=request.skills,
            generated_description=request.generated_description
        )
        
        # Insert into database
        result = await db[JOB_DESCRIPTIONS_COLLECTION].insert_one(jd_doc)
        
        # Return the created job description with ID
        # Convert ObjectId to string to make it JSON serializable
        return {
            "id": str(result.inserted_id),
            "company_description": request.company_description,
            "job_role": request.job_role,
            "location": request.location,
            "experience": request.experience,
            "qualifications": request.qualifications,
            "skills": request.skills,
            "generated_description": request.generated_description,
            "created_at": jd_doc["created_at"].isoformat(),
            "updated_at": jd_doc["updated_at"].isoformat()
        }
    except Exception as e:
        logger.error(f"Error saving job description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_job_descriptions():
    """
    Get all saved job descriptions
    """
    try:
        db = get_database()
        
        # Fetch all job descriptions
        cursor = db[JOB_DESCRIPTIONS_COLLECTION].find().sort("created_at", -1)
        job_descriptions = await cursor.to_list(length=100)
        
        # Convert ObjectId to string and datetime to ISO format
        result = []
        for jd in job_descriptions:
            result.append({
                "id": str(jd["_id"]),
                "company_description": jd.get("company_description", ""),
                "job_role": jd.get("job_role", ""),
                "location": jd.get("location", ""),
                "experience": jd.get("experience", ""),
                "qualifications": jd.get("qualifications", ""),
                "skills": jd.get("skills", ""),
                "generated_description": jd.get("generated_description", ""),
                "created_at": jd.get("created_at", datetime.now(timezone.utc)).isoformat(),
                "updated_at": jd.get("updated_at", datetime.now(timezone.utc)).isoformat()
            })
        
        return result
    except Exception as e:
        logger.error(f"Error listing job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{jd_id}")
async def get_job_description(jd_id: str):
    """
    Get a specific job description by ID
    """
    try:
        db = get_database()
        
        # Fetch job description
        jd = await db[JOB_DESCRIPTIONS_COLLECTION].find_one({"_id": ObjectId(jd_id)})
        
        if not jd:
            raise HTTPException(status_code=404, detail="Job description not found")
        # Convert ObjectId to string and datetime to ISO format
        if jd:
            return {
                "id": str(jd["_id"]),
                "company_description": jd.get("company_description", ""),
                "job_role": jd.get("job_role", ""),
                "location": jd.get("location", ""),
                "experience": jd.get("experience", ""),
                "qualifications": jd.get("qualifications", ""),
                "skills": jd.get("skills", ""),
                "generated_description": jd.get("generated_description", ""),
                "created_at": jd.get("created_at", datetime.now(timezone.utc)).isoformat(),
                "updated_at": jd.get("updated_at", datetime.now(timezone.utc)).isoformat()
            }
        
        raise HTTPException(status_code=404, detail="Job description not found")
    except Exception as e:
        logger.error(f"Error getting job description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{jd_id}")
async def delete_job_description(jd_id: str):
    """
    Delete a job description by ID
    """
    try:
        db = get_database()
        
        # Delete job description
        result = await db[JOB_DESCRIPTIONS_COLLECTION].delete_one({"_id": ObjectId(jd_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        return {"message": "Job description deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
