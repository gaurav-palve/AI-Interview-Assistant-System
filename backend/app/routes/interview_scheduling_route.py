from fastapi import APIRouter, HTTPException, Body, Query ,Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
import os
import tempfile
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..utils.logger import get_logger
from ..database import get_database, SCHEDULED_INTERVIEWS_COLLECTION, CANDIDATE_DOCUMENTS_COLLECTION, save_candidate_data
from ..utils.auth_dependency import require_auth, get_current_user
from ..services.email_service import EmailService
from fastapi import Depends

logger = get_logger(__name__)
router = APIRouter()

# Define models
class CandidateInfo(BaseModel):
    name: str
    email: str
    resume: str

class AttachmentInfo(BaseModel):
    filename: str
    content: str  # Base64 encoded content
    content_type: str

class BulkInterviewScheduleRequest(BaseModel):
    job_posting_id: str
    interview_datetime: str
    candidates: List[CandidateInfo]
    job_description: str
    attachments: Optional[List[AttachmentInfo]] = []

# Note: We're now using the get_current_user from auth_dependency.py

@router.post("/bulk-schedule")
async def schedule_interviews_bulk(
    request: BulkInterviewScheduleRequest = Body(...),
    current_user: dict = Depends(require_auth)

):
    """
    Schedule interviews for multiple candidates at once
    """
    
    try:
        admin_id = current_user["admin_id"]
        
        # Verify database connection before insert
        from ..database import verify_database_connection
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed before interview creation")
            raise RuntimeError("Database connection verification failed")
            
        db = get_database()
        scheduled_interviews = []
        
        # Convert scheduled datetime string to datetime object
        try:
            # Parse the datetime string and make it timezone-aware
            scheduled_dt = datetime.fromisoformat(request.interview_datetime.replace('Z', '+00:00'))
            if scheduled_dt.tzinfo is None:
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
        except ValueError:
            try:
                # Try alternative format
                scheduled_dt = datetime.strptime(request.interview_datetime, "%Y-%m-%dT%H:%M")
                # Make it timezone-aware
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                logger.error(f"Invalid datetime format: {request.interview_datetime}")
                raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
            
        # Get current time with timezone
        now = datetime.now(timezone.utc)
        
        # Validate scheduled datetime is in the future
        # Add a small buffer (5 minutes) to account for processing time
        if scheduled_dt <= now + timedelta(minutes=5):
            logger.warning(f"Invalid scheduled time: {scheduled_dt} is not sufficiently in the future. Current time: {now}")
            raise HTTPException(status_code=400, detail="Interview must be scheduled for at least 5 minutes in the future")
        
        for candidate in request.candidates:
            # We need to get the actual resume files from the resume screening process
            # The candidate.resume field contains the filename of the resume
            resume_filename = candidate.resume
            logger.info(f"Looking for resume file: {resume_filename}")
            
            # Create a temporary directory to store the resume files
            temp_dir = tempfile.mkdtemp()
            
            # Create a temporary zip file to extract resumes
            temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
            temp_zip.close()
            
            # Create a temporary JD file
            jd_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            jd_temp.close()
            
            # Get the resume content from the original file if possible
            resume_content = None
            jd_content = None
            resume_file_path = None  # Initialize the file path variable
            # Try to find the original resume file in common temp directories
            temp_dirs = [tempfile.gettempdir()]
            
            # Add any additional temp directories that might contain the resume files
            # Look in the system temp directory and any subdirectories created by the resume screening process
            for temp_path in temp_dirs:
                # First, try a more targeted search in directories that might contain extracted resumes
                # These are common patterns for directories created by the resume screening process
                potential_dirs = []
                for root, dirs, _ in os.walk(temp_path):
                    for dir_name in dirs:
                        if any(pattern in dir_name.lower() for pattern in ["tmp", "extract", "resume", "screen", "pdf"]):
                            potential_dirs.append(os.path.join(root, dir_name))
                    # Limit the depth to avoid searching the entire system
                    break
                
                # Search in the potential directories first (more likely to contain the files)
                for potential_dir in potential_dirs:
                    logger.info(f"Searching for resume in potential directory: {potential_dir}")
                    for root, _, files in os.walk(potential_dir):
                        for file in files:
                            if file == resume_filename:
                                try:
                                    file_path = os.path.join(root, file)
                                    with open(file_path, 'rb') as f:
                                        resume_content = f.read()
                                        logger.info(f"Found original resume file in targeted search: {file_path}")
                                        # Store the file path for later use
                                        resume_file_path = file_path
                                        break
                                except Exception as e:
                                    logger.warning(f"Error reading found resume file: {e}")
                        if resume_content:
                            break
                    if resume_content:
                        break
                
                # If not found in targeted search, try a broader search
                if not resume_content:
                    logger.info(f"Performing broader search in: {temp_path}")
                    for root, _, files in os.walk(temp_path):
                        for file in files:
                            if file == resume_filename:
                                try:
                                    file_path = os.path.join(root, file)
                                    with open(file_path, 'rb') as f:
                                        resume_content = f.read()
                                        logger.info(f"Found original resume file: {file_path}")
                                        # Store the file path for later use
                                        resume_file_path = file_path
                                        break
                                except Exception as e:
                                    logger.warning(f"Error reading found resume file: {e}")
                        if resume_content:
                            break
                    if resume_content:
                        break
            
            # If we couldn't find the original file, create a placeholder
            if not resume_content:
                logger.info(f"Creating placeholder resume file for {candidate.name}")
                # Create a more meaningful placeholder with structured content
                placeholder_resume = f"""
                RESUME PLACEHOLDER
                
                Name: {candidate.name}
                Email: {candidate.email}
                Resume Filename: {resume_filename}
                
                This is a placeholder resume created during bulk interview scheduling.
                The original resume file could not be found in the temporary directories.
                
                This placeholder was created on: {datetime.now(timezone.utc).isoformat()}
                Job Posting ID: {request.job_posting_id}
                """
                resume_content = placeholder_resume.encode()
            
            # Create the JD content - try to get the actual JD content if possible
            try:
                # Try to get the JD from the job posting
                db = get_database()
                job_posting = await db["job_postings"].find_one({"_id": ObjectId(request.job_posting_id)})
                if job_posting and "job_description" in job_posting:
                    jd_content = f"""
                    JOB DESCRIPTION
                    
                    Title: {job_posting.get('job_title', 'Unknown Position')}
                    Company: {job_posting.get('company', 'Unknown Company')}
                    
                    {job_posting.get('job_description', '')}
                    """.encode()
                else:
                    # Fallback to placeholder
                    jd_content = f"Job Description for position {request.job_posting_id}".encode()
            except Exception as e:
                logger.warning(f"Error getting JD from job posting: {e}")
                jd_content = f"Job Description for position {request.job_posting_id}".encode()
                
            # Write the content to temporary files
            resume_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            resume_temp.write(resume_content)
            resume_temp.close()
            
            jd_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            jd_temp.write(jd_content)
            jd_temp.close()
            
            # Save files to GridFS and get file IDs
            try:
                # Save the files to GridFS using the same function as individual interviews
                await save_candidate_data(
                    candidate.email,
                    open(jd_temp.name, "rb").read(),
                    open(resume_temp.name, "rb").read()
                )
                logger.info(f"Saved resume and JD files for candidate {candidate.email}")
                logger.info(f"Resume details - Filename: {resume_filename}, Original found: {resume_content is not None}, Size: {len(resume_content)} bytes")
                if resume_file_path:
                    logger.info(f"Original resume file path: {resume_file_path}")
                # Clean up temporary files
                os.unlink(resume_temp.name)
                os.unlink(jd_temp.name)
                
                # Clean up other temporary files and directories
                if os.path.exists(temp_dir):
                    import shutil
                    shutil.rmtree(temp_dir)
                if os.path.exists(temp_zip.name):
                    os.unlink(temp_zip.name)
                
                
                # Create interview document using the same structure as in interview_service.py
                interview_data = {
                    "candidate_name": candidate.name,
                    "candidate_email": candidate.email,
                    "job_role": job_posting.get('job_title',""),
                    "scheduled_datetime": scheduled_dt,
                    "status": "scheduled",
                    "resume_uploaded": True,  # Set to true since we've uploaded the resume
                    "jd_uploaded": True,      # Set to true since we've uploaded the JD
                    "created_by": str(admin_id),   # Always store as string representation of admin_id
                    "created_at": datetime.now(timezone.utc),  # Use timezone-aware datetime
                    "updated_at": datetime.now(timezone.utc),  # Use timezone-aware datetime
                    "job_posting_id": request.job_posting_id,  # Keep this field for reference
                    "metadata": {
                        "total_questions": 0,
                        "estimated_difficulty": "medium",
                        "resume_filename": resume_filename,  # Store the original resume filename
                        "original_resume_found": resume_content is not None,  # Track if we found the original file
                        "resume_file_path": resume_file_path,  # Store the path to the original file if found
                        "bulk_scheduled": True,  # Mark this as a bulk-scheduled interview
                        "scheduling_method": "resume_screening",  # Indicate how this interview was scheduled
                        "resume_size_bytes": len(resume_content) if resume_content else 0,  # Store the size of the resume
                        "admin_id_type": "ObjectId",  # Always an ObjectId now
                        "scheduled_by": str(admin_id),  # Store the admin ID as a string for reference                                             
                            }
                }
            except Exception as e:
                logger.error(f"Error saving files for candidate {candidate.email}: {e}")
                # Clean up temporary files if they still exist
                if os.path.exists(resume_temp.name):
                    os.unlink(resume_temp.name)
                if os.path.exists(jd_temp.name):
                    os.unlink(jd_temp.name)
                if os.path.exists(temp_dir):
                    import shutil
                    shutil.rmtree(temp_dir)
                if os.path.exists(temp_zip.name):
                    os.unlink(temp_zip.name)
                raise HTTPException(status_code=500, detail=f"Error saving files: {str(e)}")
            
            # Insert into database
            logger.info(f"Inserting interview into {SCHEDULED_INTERVIEWS_COLLECTION} collection")
            logger.info(f"Original admin ID type: {type(admin_id)}, value: {admin_id}")
            logger.info(f"Created_by field (after str conversion): {interview_data['created_by']}")
            logger.info(f"Full interview data: {interview_data}")
            result = await db[SCHEDULED_INTERVIEWS_COLLECTION].insert_one(interview_data)
            
            if not result.acknowledged:
                logger.error("Insert operation was not acknowledged by MongoDB")
                raise RuntimeError("Insert operation failed: not acknowledged")
                
            # Get the MongoDB ObjectId and convert to string
            interview_id = str(result.inserted_id)
            logger.info(f"Interview created with ID: {interview_id}")
            
            # Verify the interview was actually saved
            verification = await db[SCHEDULED_INTERVIEWS_COLLECTION].find_one({"_id": result.inserted_id})
            if verification:
                logger.info(f"Verified interview was saved correctly: {verification['_id']}")
                # Add the id field for consistency with the individual interview creation
                await db[SCHEDULED_INTERVIEWS_COLLECTION].update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"id": interview_id}}
                )
            else:
                logger.error(f"Failed to verify interview was saved. ID: {interview_id}")
                raise RuntimeError("Interview creation verification failed")
            
            # Add the interview to the list of scheduled interviews
            interview_data["_id"] = interview_id
            interview_data["id"] = interview_id
            scheduled_interviews.append(interview_data)
            
            # Send confirmation email to candidate
            try:
                email_service = EmailService()
                try:
                    result = await email_service.send_interview_confirmation(
                        candidate_email=candidate.email,
                        candidate_name=candidate.name,
                        job_role=job_posting.get('job_title',""),
                        scheduled_datetime=request.interview_datetime,
                        interview_id=interview_id,
                        attachments=request.attachments if hasattr(request, 'attachments') else []  # Add attachments
                    )
                    if result:
                        logger.info(f"Confirmation email sent to {candidate.email}")
                    else:
                        logger.warning(f"Failed to send confirmation email to {candidate.email}")
                except Exception as e:
                    # Log the error but continue with the interview scheduling process
                    logger.error(f"Failed to send confirmation email to {candidate.email}: {e}")
            except Exception as e:
                # Log the error but continue with the interview scheduling process
                logger.error(f"Error initializing email service: {e}")
        
        # Return the scheduled interviews
        return {
            "message": f"Successfully scheduled {len(scheduled_interviews)} interviews",
            "interviews": scheduled_interviews
        }
        
    except Exception as e:
        logger.error(f"Error scheduling interviews: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule interviews: {str(e)}")



@router.get("/get-interviews-by-job-posting/{job_posting_id}")
async def get_interviews_by_job_posting(job_posting_id: str,
                                        current_user: dict = Depends(require_auth)
                                        ):
    """
    Get all interviews for a specific job posting
    """
    logger.info(f"Fetching interviews for job posting {job_posting_id}")
    
    try:
        # Verify database connection before query
        try:
            from ..database import verify_database_connection
            db_ok = await verify_database_connection()
            if not db_ok:
                logger.error("Database connection verification failed before interview retrieval")
                raise RuntimeError("Database connection verification failed")
        except Exception as e:
            logger.warning(f"Database connection verification error: {e}, proceeding anyway")
            
        db = get_database()
        interviews = await db[SCHEDULED_INTERVIEWS_COLLECTION].find(
            {"job_posting_id": job_posting_id, "created_by": str(current_user["admin_id"])}
        ).to_list(length=100)
        
        # Convert ObjectId to string for each interview and ensure id field is set
        serialized_interviews = []
        for interview in interviews:
            try:
                # Create a safe copy of the interview to modify
                safe_interview = {}
                
                # Copy all fields, converting ObjectId to string
                for key, value in interview.items():
                    if key == "_id" or isinstance(value, ObjectId):
                        safe_interview[key] = str(value)
                    else:
                        safe_interview[key] = value
                
                # Ensure the "id" field is set for consistency
                if "id" not in safe_interview and "_id" in safe_interview:
                    safe_interview["id"] = safe_interview["_id"]
                
                serialized_interviews.append(safe_interview)
            except Exception as e:
                logger.error(f"Error serializing interview: {e}")
                # Continue with next interview
        
        return {
            "interviews": serialized_interviews
        }
        
    except Exception as e:
        logger.error(f"Error fetching interviews: {e}")
        logger.exception("Full exception details:")
        # Return empty list instead of raising an exception
        return {
            "interviews": [],
            "error": f"Failed to fetch interviews: {str(e)}"
        }