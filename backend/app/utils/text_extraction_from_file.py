from PyPDF2 import PdfReader
from fastapi import UploadFile, HTTPException
import io
import docx
from app.utils.logger import get_logger

logger = get_logger(__name__)

def extract_text_from_upload(upload_file: UploadFile):
    """
    Extract text from uploaded PDF or Word document
    Returns tuple of (extracted_text, original_binary_content)
    """
    try:
        content = upload_file.file.read()
        
        # Check file type and extract text accordingly
        if upload_file.filename.lower().endswith('.pdf'):
            # Handle PDF files
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        elif upload_file.filename.lower().endswith('.docx'):
            # Handle DOCX files using python-docx
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            logger.info(f"DOCX document processed: {upload_file.filename}")
        elif upload_file.filename.lower().endswith('.doc'):
            # Old .doc format is not directly supported by python-docx
            text = f"Text extracted from Word document: {upload_file.filename}"
            logger.info(f"DOC document detected: {upload_file.filename} (limited support)")
        else:
            # Handle unsupported file types
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {upload_file.filename}")
        
        # Reset file pointer for potential reuse
        upload_file.file.seek(0)
       
        return text, content
        
    except Exception as e:
        logger.error(f"Error extracting text from {upload_file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")