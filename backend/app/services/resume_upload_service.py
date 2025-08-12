from bson import ObjectId
from ..utils.text_extraction_from_file import extract_text_from_upload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import UploadFile
from ..database import save_candidate_data
from ..utils.logger import get_logger
import io

logger = get_logger(__name__)

async def save_files(candidate_email, jd: UploadFile, resume: UploadFile):
    try:
        logger.info(f"Started processing candidate {candidate_email}")

        # Extract text and binary content
        jd_text, jd_bytes = extract_text_from_upload(jd)
        resume_text, resume_bytes = extract_text_from_upload(resume)

        # Use await with the async save_candidate_data function
        await save_candidate_data(candidate_email, jd_bytes, resume_bytes)
        
        logger.info(f"Successfully saved files for candidate {candidate_email}")
        return True
    except Exception as e:
        logger.error(f"Error while saving the files: {e}")
        raise RuntimeError(f"Error while saving the files: {e}")