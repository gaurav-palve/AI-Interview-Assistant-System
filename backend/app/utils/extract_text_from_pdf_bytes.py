from PyPDF2 import PdfReader
import io

async def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """
    Extracts text from PDF bytes.
    """
    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"Error extracting text from PDF: {e}")
        return ""