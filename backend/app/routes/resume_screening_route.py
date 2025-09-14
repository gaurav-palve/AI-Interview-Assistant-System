from fastapi import APIRouter, UploadFile, File
import tempfile
import shutil
import asyncio
from app.services.resume_screening_service import process_resume_screening

router = APIRouter()

@router.post("/resume-screening")
async def resume_screening_endpoint(zip_file: UploadFile = File(...), jd_file: UploadFile = File(...)):
    # Save uploaded files to temp
    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    shutil.copyfileobj(zip_file.file, temp_zip)
    temp_zip.close()

    temp_jd = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    shutil.copyfileobj(jd_file.file, temp_jd)
    temp_jd.close()

    results = await process_resume_screening(temp_zip.name, temp_jd.name)
    return results
