from PyPDF2 import PdfReader
import io
import logging
import fitz  # PyMuPDF
from app.database import get_jd_from_db

logger = logging.getLogger(__name__)

async def extract_text_from_jd(candidate_email):
    try:
        logger.info(f"Attempting to retrieve JD for candidate: {candidate_email}")
        jd = await get_jd_from_db(candidate_email)

        if not jd:
            logger.error("JD not found in database.")
            return ""   # simply return empty

        logger.info(f"Successfully retrieved JD for candidate: {candidate_email} (size: {len(jd)} bytes)")

        # ---------------------------------------------------------
        # 1️⃣ Detect if the file is NOT a PDF (root cause fix)
        # ---------------------------------------------------------
        if not jd.startswith(b"%PDF"):
            logger.warning("JD file is NOT a valid PDF. Treating it as plain text.")
            try:
                return jd.decode("utf-8", errors="ignore").strip()
            except:
                return ""   # return empty if decoding fails

        # ---------------------------------------------------------
        # 2️⃣ Try PyPDF2
        # ---------------------------------------------------------
        try:
            pdf_stream = io.BytesIO(jd)
            reader = PdfReader(pdf_stream, strict=False)
            text = ""

            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

            if text.strip():
                logger.info("Successfully extracted text from JD with PyPDF2.")
                return text.strip()

            logger.warning("PyPDF2 returned empty text. Trying PyMuPDF...")

        except Exception as e:
            logger.error(f"PyPDF2 failed: {e}")

        # ---------------------------------------------------------
        # 3️⃣ Try PyMuPDF
        # ---------------------------------------------------------
        try:
            logger.info("Attempting to extract text using PyMuPDF...")
            text = ""

            with fitz.open(stream=jd, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text("text") + "\n"

            if text.strip():
                logger.info("Successfully extracted text via PyMuPDF.")
                return text.strip()

        except Exception as e:
            logger.error(f"PyMuPDF failed: {e}")

        # ---------------------------------------------------------
        # 4️⃣ All PDF methods failed → return nothing
        # ---------------------------------------------------------
        logger.error("JD parsing failed — returning empty string.")
        return ""

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return ""
