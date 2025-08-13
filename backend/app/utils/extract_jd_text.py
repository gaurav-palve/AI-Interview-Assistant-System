from PyPDF2 import PdfReader
import io
import logging
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
        
        # Process the PDF
        try:
            pdf_stream = io.BytesIO(jd)
            reader = PdfReader(pdf_stream)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            extracted_text = text.strip()
            logger.info(f"Successfully extracted text from JD (length: {len(extracted_text)} chars)")
            return extracted_text
        except Exception as e:
            logger.error(f"Error processing JD PDF: {e}")
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
