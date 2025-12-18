from fastapi import APIRouter, HTTPException, Depends, Query
from ..schemas.interview_schema import (
    InterviewCreate, InterviewUpdate, InterviewResponse, InterviewListResponse
)
from ..services.interview_service import InterviewService
from typing import Optional
from ..utils.auth_dependency import require_auth
from fastapi import Request
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Interviews"])

# The require_auth function is now imported from auth_dependency.py

@router.post("/create-interview", response_model=dict,
             )
async def create_interview(
    request: Request,
    interview_data: InterviewCreate,
    current_user: dict = Depends(require_auth)
):
    """Create a new interview"""
    logger.info(f"Request to create interview for candidate: {interview_data.candidate_email}")
    logger.info(f"Interview data: {interview_data}")
    
    try:
        # Verify database connection
        from ..database import verify_database_connection
        db_ok = await verify_database_connection()
        if not db_ok:
            logger.error("Database connection verification failed before creating interview")
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Create interview
        interview_service = InterviewService()
        interview_id = await interview_service.create_interview(
            interview_data,
            str(current_user["_id"])
        )
        
        # Verify the interview was created
        logger.info(f"Verifying interview creation with ID: {interview_id}")
        verification = await interview_service.get_interview(interview_id)
        
        if not verification:
            logger.error(f"Failed to verify interview creation. ID: {interview_id}")
            raise HTTPException(status_code=500, detail="Interview creation verification failed")
        
        logger.info(f"Interview created and verified with ID: {interview_id}")
        
        return {
            "message": "Interview created successfully",
            "interview_id": interview_id,
            "status": "success"
        }
    except ValueError as e:
        logger.warning(f"Validation error creating interview: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error creating interview: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/get-interview/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    request: Request,
    current_user: dict = Depends(require_auth)
):
    """Get interview by ID"""
    try:
        interview_service = InterviewService()
        interview = await interview_service.get_interview(interview_id)
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Check if user has access to this interview
        if interview["created_by"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return interview
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting interview {interview_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/list-interviews", response_model=InterviewListResponse)
async def list_interviews(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(require_auth)
):
    """List interviews created by the current user"""
    try:
        logger.info(f"Received request to list interviews. Query params: {request.query_params}")
        print(current_user)
        print(40*"-")
        # Process the interview listing
        user_id = str(current_user["_id"])  # Convert ObjectId to string
        logger.info(f"Fetching interviews for user ID: {user_id}")
        interview_service = InterviewService()
        result = await interview_service.get_interviews_by_creator(
            user_id,
            page,
            page_size
        )
        
        logger.info(f"Successfully retrieved {len(result['interviews'])} interviews")
        
        return InterviewListResponse(
            interviews=result["interviews"],
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"]
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.exception(f"Unexpected error listing interviews: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update-interview/{interview_id}", response_model=dict)
async def update_interview(
    interview_id: str,
    update_data: InterviewUpdate,
    current_user: dict = Depends(require_auth)
):
    """Update an existing interview"""
    try:
        interview_service = InterviewService()
        success = await interview_service.update_interview(
            interview_id, 
            update_data, 
            str(current_user["_id"])
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Interview not found or access denied")
        
        return {
            "message": "Interview updated successfully",
            "interview_id": interview_id,
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating interview {interview_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/delete-interview/{interview_id}", response_model=dict)
async def delete_interview(
    interview_id: str,
    current_user: dict = Depends(require_auth)
):
    """Delete an interview"""
    try:
        interview_service = InterviewService()
        success = await interview_service.delete_interview(
            interview_id, 
            str(current_user["_id"])
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Interview not found or access denied")
        
        return {
            "message": "Interview deleted successfully",
            "interview_id": interview_id,
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting interview {interview_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats/summary", response_model=dict)
async def get_interview_statistics(
    current_user: dict = Depends(require_auth)
):
    """Get interview statistics for the current user"""
    try:
        interview_service = InterviewService()
        stats = await interview_service.get_interview_statistics(str(current_user["_id"]))
        
        return {
            "message": "Statistics retrieved successfully",
            "data": stats,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting interview statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
