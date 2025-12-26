from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import tempfile
import shutil
import asyncio
from app.services.resume_screening_service import process_resume_screening
from app.database import upsert_screening_results,get_database, SCREENING_COLLECTION
from app.utils.auth_dependency import get_current_user, require_permission
from fastapi.params import Depends


router = APIRouter()

@router.post("/resume-screening", status_code=202)
async def resume_screening_endpoint(
    resume_file: UploadFile = File(...),
    jd_file: UploadFile = File(...),
    job_post_id: str = Form(None),
    current_user: dict = Depends(require_permission("RESUME_SCREEN"))
):
    # -------------------------------
    # 1. Save resume (ZIP or PDF)
    # -------------------------------
    filename = resume_file.filename.lower()

    if filename.endswith(".zip"):
        suffix = ".zip"
    elif filename.endswith(".pdf"):
        suffix = ".pdf"
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid resume file format. Upload a .zip or .pdf"
        )

    temp_resume = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    shutil.copyfileobj(resume_file.file, temp_resume)
    temp_resume.close()

    # -------------------------------
    # 2. Save JD file (PDF only)
    # -------------------------------
    if not jd_file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="JD file must be a PDF"
        )

    temp_jd = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    shutil.copyfileobj(jd_file.file, temp_jd)
    temp_jd.close()

    results = await process_resume_screening(temp_resume.name, temp_jd.name, job_post_id)
    await upsert_screening_results(results,job_post_id)
    return {"detail": "Screening results stored"}



@router.get("/get-resume-screening/results")
async def get_resume_screening_results(job_posting_id: str, current_user: dict = Depends(require_permission("RESUME_SCREEN"))):
    """
    Fetch all saved resume screening results (up to 1000 records).
    """
    db = get_database()
    query = {"job_posting_id": job_posting_id}

    cursor = db[SCREENING_COLLECTION].find(query)
    results = await cursor.to_list(length=1000)

    # Convert any ObjectId to string for JSON serialization
    for doc in results:
        if "_id" in doc:
            try:
                doc["_id"] = str(doc["_id"])
            except Exception:
                pass

    return {"results": results}
