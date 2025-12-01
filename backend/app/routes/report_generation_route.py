from fastapi import APIRouter, HTTPException, Response, Query
from bson import Binary, ObjectId
from app.database import fetch_interview_report_data, get_database, CANDIDATES_REPORTS_COLLECTION
from typing import List, Optional
import base64
from app.utils.logger import get_logger
from fastapi import Depends
from app.utils.auth_dependency import require_auth
logger = get_logger(__name__)

router = APIRouter()

@router.get("/download-report-pdf")
async def download_report_pdf(interview_id: str,
                              current_user: dict = Depends(require_auth)):
    """
    Fetch the stored PDF from MongoDB and return it as a downloadable file.
    """
    try:
        logger.info(f"Fetching report data for interview ID: {interview_id}")
        data = await fetch_interview_report_data(interview_id)
        if not data:
            logger.warning(f"No report data found for interview ID: {interview_id}")
            raise HTTPException(status_code=404, detail="Report data not found")

        # Check if report_pdf field exists
        if "report_pdf" not in data:
            logger.warning(f"No report_pdf field in report data for interview ID: {interview_id}")
            raise HTTPException(status_code=404, detail="Report PDF not found. The PDF may not have been generated yet.")
        
        logger.info(f"Found report_pdf field with type: {type(data['report_pdf'])}")

        pdf_binary = data["report_pdf"]

        # Handle different possible formats (Binary, bytes, or base64 dict)
        try:
            if isinstance(pdf_binary, Binary):
                pdf_bytes = bytes(pdf_binary)
            elif isinstance(pdf_binary, bytes):
                # Already in bytes format, use directly
                pdf_bytes = pdf_binary
            elif isinstance(pdf_binary, dict) and "$binary" in pdf_binary:
                base64_data = pdf_binary["$binary"]["base64"]
                pdf_bytes = base64.b64decode(base64_data)
            else:
                logger.error(f"Invalid PDF format: {type(pdf_binary)}")
                raise HTTPException(status_code=400, detail=f"Invalid PDF format in database: {type(pdf_binary)}")

            # Log success and PDF size
            logger.info(f"Successfully processed PDF data, size: {len(pdf_bytes)} bytes")
            
            # Return PDF as downloadable response
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=Candidate_Assessment_Report_{interview_id}.pdf"},
            )
        except Exception as e:
            logger.error(f"Error processing PDF binary: {e}, type: {type(pdf_binary)}")
            # Include more details in the error message
            if isinstance(pdf_binary, bytes):
                logger.error(f"PDF bytes length: {len(pdf_binary)}")
            elif isinstance(pdf_binary, Binary):
                logger.error(f"Binary object type: {type(pdf_binary)}")
            elif isinstance(pdf_binary, dict):
                logger.error(f"Dictionary keys: {pdf_binary.keys()}")
            raise HTTPException(status_code=500, detail=f"Error processing PDF data: {e}")

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching PDF: {e}")



@router.get("/candidate_reports")
async def list_candidate_reports(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None,
    job_role: Optional[str] = None,
    interview_id: Optional[str] = None,
    current_user: dict = Depends(require_auth)
):
    """
    Fetch all candidate reports with pagination and filtering options.
    Returns a list of reports without the PDF binary data.
    """
    try:
        db = get_database()
        
        # Build the filter query
        filter_query = {}
        if candidate_name:
            filter_query["candidate_name"] = {"$regex": candidate_name, "$options": "i"}
        if candidate_email:
            filter_query["candidate_email"] = {"$regex": candidate_email, "$options": "i"}
        if job_role:
            filter_query["job_role"] = {"$regex": job_role, "$options": "i"}
        if interview_id:
            filter_query["interview_id"] = interview_id
            
        # Calculate skip value for pagination
        skip = (page - 1) * page_size
        
        # Get total count for pagination
        total_count = await db["candidates_reports"].count_documents(filter_query)
        
        # Fetch reports with pagination
        cursor = db["candidates_reports"].find(
            filter_query,
            # Exclude the PDF binary data to reduce response size
            {"report_pdf": 0}
        ).skip(skip).limit(page_size)
        
        # Convert cursor to list
        reports = await cursor.to_list(length=page_size)
        
        # Convert ObjectId to string for JSON serialization
        for report in reports:
            if "_id" in report:
                report["_id"] = str(report["_id"])
        
        # Calculate total pages
        total_pages = (total_count + page_size - 1) // page_size
        
        logger.info(f"Fetched {len(reports)} candidate reports (page {page}/{total_pages})")
        
        return {
            "reports": reports,
            "pagination": {
                "total": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching candidate reports: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching candidate reports: {e}")
    


@router.get("/job_posting_candidate_reports")
async def job_posting_candidate_reports(
    job_posting_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None,
    job_role: Optional[str] = None,
    interview_id: Optional[str] = None,
    current_user: dict = Depends(require_auth)
):
    """
    Fetch all candidate reports with pagination and filtering options.
    Returns a list of reports without the PDF binary data.
    """
    try:
        db = get_database()
        
        
        # Fetch reports with pagination
        cursor = db["candidates_reports"].find(
            {"job_posting_id": str(job_posting_id)},
            # Exclude the PDF binary data to reduce response size
            {"report_pdf": 0}
        )
        
        # Convert cursor to list
        reports = await cursor.to_list(length=page_size)
        
        # Convert ObjectId to string for JSON serialization
        for report in reports:
            if "_id" in report:
                report["_id"] = str(report["_id"])
        
        
        return {
            "reports": reports,
            "pagination": {
                "page": page,
                "page_size": page_size,
            }
        }
        
    except Exception as e:
        logger.error(f"Error in job_posting_candidate_reports: {e}")
        raise HTTPException(status_code=500, detail=f"Error in job_posting_candidate_reports: {e}")



##single candidate report
@router.get("/candidate_report/{interview_id}")
async def candidate_report(
    interview_id: str,
    current_user: dict = Depends(require_auth)
):
    """
    Fetch all candidate reports with pagination and filtering options.
    Returns a list of reports without the PDF binary data.
    """
    try:
        db = get_database()
        
        report_data = await db[CANDIDATES_REPORTS_COLLECTION].find_one(
            {"interview_id": str(interview_id)},
            {"report_pdf": 0, "_id":0}  # Exclude the PDF binary data
        )
        logger.info(f"Fetched candidate reports data for interview ID: {interview_id}")
        
        return {
            "reports": report_data,
        }
        
    except Exception as e:
        logger.error(f"Error fetching candidate reports: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching candidate reports: {e}")
