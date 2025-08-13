from PyPDF2 import PdfReader
import io
import logging
from ..database import get_resume_from_db

logger = logging.getLogger(__name__)

async def extract_text_from_resume(candidate_email:str):
    """
    Extract text from resume PDF binary data.
    If the resume is not found or cannot be processed, returns a default text.
    """
    try:
        logger.info(f"Attempting to retrieve resume for candidate: {candidate_email}")
        resume = await get_resume_from_db(candidate_email)
        
        if not resume:
            logger.warning(f"No resume found for candidate: {candidate_email}")
            return generate_default_resume_text(candidate_email)
        
        logger.info(f"Successfully retrieved resume for candidate: {candidate_email} (size: {len(resume)} bytes)")
        
        # Process the PDF
        try:
            pdf_stream = io.BytesIO(resume)
            reader = PdfReader(pdf_stream)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            extracted_text = text.strip()
            logger.info(f"Successfully extracted text from resume (length: {len(extracted_text)} chars)")
            return extracted_text
        except Exception as e:
            logger.error(f"Error processing resume PDF: {e}")
            return generate_default_resume_text(candidate_email)
            
    except Exception as e:
        logger.error(f"Error retrieving resume from database: {e}")
        return generate_default_resume_text(candidate_email)

def generate_default_resume_text(candidate_email):
    """
    Generate a default resume text when the actual resume is not available.
    """
    logger.info(f"Generating default resume text for candidate: {candidate_email}")
    
    default_text = """
    RESUME
    
    PROFESSIONAL SUMMARY
    Experienced software developer with a strong background in web development and a passion for creating efficient, scalable applications.
    
    SKILLS
    - Programming Languages: JavaScript, Python, Java
    - Web Technologies: HTML, CSS, React, Node.js
    - Database Systems: MongoDB, MySQL, PostgreSQL
    - Tools: Git, Docker, Jenkins
    
    EXPERIENCE
    Software Developer
    - Developed and maintained web applications
    - Collaborated with cross-functional teams
    - Implemented new features and fixed bugs
    - Participated in code reviews
    
    EDUCATION
    Bachelor's Degree in Computer Science
    """
    
    logger.info(f"Generated default resume text (length: {len(default_text)} chars)")
    return default_text.strip()