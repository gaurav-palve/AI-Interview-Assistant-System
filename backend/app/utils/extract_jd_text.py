from PyPDF2 import PdfReader
import io
import logging
import fitz  # PyMuPDF
import pymupdf
from ..database import get_jd_from_db

logger = logging.getLogger(__name__)

async def extract_text_from_jd(candidate_email):
    """
    Extract text from job description PDF binary data.
    If the JD is not found or cannot be processed, returns a default text.
    """
    try:
        logger.info(f"Attempting to retrieve JD for candidate: {candidate_email}")
        jd = await get_jd_from_db(candidate_email)
        
        if not jd:
            logger.warning(f"No JD found for candidate: {candidate_email}")
            return generate_default_jd_text(candidate_email)
        
        logger.info(f"Successfully retrieved JD for candidate: {candidate_email} (size: {len(jd)} bytes)")
        
        # Try PyPDF2 first
        try:
            pdf_stream = io.BytesIO(jd)
            reader = PdfReader(pdf_stream, strict=False)  # allow minor corruption
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

            extracted_text = text.strip()
            if extracted_text:
                logger.info(f"Successfully extracted text from JD with PyPDF2 (length: {len(extracted_text)} chars)")
                return extracted_text
            else:
                logger.warning("PyPDF2 returned empty text, trying PyMuPDF fallback...")

        except Exception as e:
            logger.error(f"PyPDF2 failed to process JD PDF: {e}")

        # Fallback: Use PyMuPDF
        try:
            logger.info("Attempting to extract text using PyMuPDF as fallback...")
            text = ""
            with fitz.open(stream=jd, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text("text") + "\n"

            extracted_text = text.strip()
            if extracted_text:
                logger.info(f"Successfully extracted text from JD with PyMuPDF (length: {len(extracted_text)} chars)")
                return extracted_text
            else:
                logger.warning("PyMuPDF returned empty text, using default JD...")

        except Exception as e:
            logger.error(f"PyMuPDF failed to process JD PDF: {e}")

        # If everything fails, log JD preview and fallback
        logger.error(f"JD could not be parsed. First 100 bytes: {jd[:100]}")
        return generate_default_jd_text(candidate_email)
    
    except Exception as e:
        logger.error(f"Error retrieving JD from database: {e}")
        return generate_default_jd_text(candidate_email)

def generate_default_jd_text(candidate_email):
    """
    Generate a default job description text when the actual JD is not available.
    """
    logger.info(f"Generating default JD text for candidate: {candidate_email}")
    
    default_text = """
    Job Description: Software Developer
    
    We are looking for a skilled Software Developer to join our team. The ideal candidate should have:
    
    - Strong programming skills in one or more languages
    - Experience with web development frameworks
    - Knowledge of database systems
    - Good problem-solving abilities
    - Excellent communication skills
    
    Responsibilities:
    - Develop and maintain software applications
    - Collaborate with cross-functional teams
    - Write clean, maintainable code
    - Troubleshoot and debug applications
    - Stay up-to-date with emerging trends and technologies
    """
    
    logger.info(f"Generated default JD text (length: {len(default_text)} chars)")
    return default_text.strip()
