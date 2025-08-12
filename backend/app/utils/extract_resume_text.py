from PyPDF2 import PdfReader
import io
from ..database import get_resume_from_db

async def extract_text_from_resume(candidate_email:str):
    """
    Extract text from resume PDF binary data.
    """
    resume = await get_resume_from_db(candidate_email)
    if not resume:
        return ""
    pdf_stream = io.BytesIO(resume)
    reader = PdfReader(pdf_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()