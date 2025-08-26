from fastapi import APIRouter, HTTPException, Body
from app.database import get_mcq_answers
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.responses import FileResponse
import pandas as pd
import os
from app.utils.mcq_excel_generation import mcq_report_excel_generation


router = APIRouter(prefix="/mcq-report", tags=["MCQ-Report-Generation"])

class InterviewIdRequest(BaseModel):
    interview_id: str

@router.post("/mcq-report-generation")
async def mcq_report_generation(request: InterviewIdRequest = Body(...)):
    mcq_data = await get_mcq_answers(request.interview_id)
    await mcq_report_excel_generation(mcq_data)

    if mcq_data is None:
        raise HTTPException(status_code=500, detail="Error retrieving MCQ answers")
    return {"mcq_answers": mcq_data}



