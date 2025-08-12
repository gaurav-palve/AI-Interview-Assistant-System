from PyPDF2 import PdfReader
import io
from ..database import get_jd_from_db

async def extract_text_from_jd(candidate_email):
    """
    Extract text from job description PDF binary data.
    """
    jd = await get_jd_from_db(candidate_email)
    if not jd:
        return ""
    pdf_stream = io.BytesIO(jd)
    reader = PdfReader(pdf_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

