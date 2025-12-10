from fastapi import APIRouter, HTTPException, UploadFile, File
import tempfile
import shutil
import asyncio
from app.services.resume_screening_service import process_resume_screening

router = APIRouter()

@router.post("/resume-screening")
async def resume_screening_endpoint(
    resume_file: UploadFile = File(...),
    jd_file: UploadFile = File(...)
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

    # -------------------------------
    # 3. Process resumes
    # -------------------------------
    results = await process_resume_screening(temp_resume.name, temp_jd.name)

    return results
