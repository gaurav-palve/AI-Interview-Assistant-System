from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from database import interviews_collection
import os
from datetime import datetime
from bson import ObjectId
import shutil

router = APIRouter(prefix="/admin", tags=["Admin"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/interview")
async def create_interview(
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    job_title: str = Form(...),
    interview_datetime: str = Form(...),  # Expecting "YYYY-MM-DD HH:MM"
    jd_file: UploadFile = File(...),
    resume_file: UploadFile = File(...)
):
    try:
        # 1️⃣ Save JD file
        jd_path = os.path.join(UPLOAD_FOLDER, f"jd_{jd_file.filename}")
        with open(jd_path, "wb") as buffer:
            shutil.copyfileobj(jd_file.file, buffer)

        # 2️⃣ Save Resume file
        resume_path = os.path.join(UPLOAD_FOLDER, f"resume_{resume_file.filename}")
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resume_file.file, buffer)

        # 3️⃣ Convert date/time string to datetime object
        try:
            interview_dt = datetime.strptime(interview_datetime, "%Y-%m-%d %H:%M")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format. Use YYYY-MM-DD HH:MM")

        # 4️⃣ Save to MongoDB
        interview_data = {
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "job_title": job_title,
            "interview_datetime": interview_dt,
            "jd_file_path": jd_path,
            "resume_file_path": resume_path,
            "status": "scheduled",  # scheduled | completed | cancelled
            "created_at": datetime.utcnow()
        }

        result = interviews_collection.insert_one(interview_data)

        # 5️⃣ Send Email (placeholder)
        # TODO: integrate real email service later
        print(f"📧 Email would be sent to {candidate_email} for interview at {interview_dt}")

        return JSONResponse(
            content={"message": "Interview created successfully", "interview_id": str(result.inserted_id)},
            status_code=201
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
