import asyncio
import io
from PyPDF2 import PdfReader
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

# Define collection names as constants
AUTH_COLLECTION = "auth_collection"
SCHEDULED_INTERVIEWS_COLLECTION = "scheduled_interviews"
CANDIDATE_DOCUMENTS_COLLECTION = "candidate_documents"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017/')
        db = client['interview_assistant']
        await client.admin.command('ping')  # test connection
        print("✅ MongoDB connected")
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        raise

def get_database():
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db

async def get_resume_from_db(candidate_email: str) -> bytes:
    db = get_database()
    fs = AsyncIOMotorGridFSBucket(db)

    candidate_doc = await db[CANDIDATE_DOCUMENTS_COLLECTION].find_one(
        {"candidate_email": candidate_email},
        {"resume_file_id": 1}
    )

    if not candidate_doc or "resume_file_id" not in candidate_doc:
        print("⚠ Resume not found")
        return None

    resume_file_id = candidate_doc["resume_file_id"]
    grid_out = await fs.open_download_stream(resume_file_id)
    resume_data = await grid_out.read()
    return resume_data



async def extract_text_from_resume(candidate_email="gauravpalve28@gmail.com"):
    """
    Extract text from resume PDF binary data.
    """
    await connect_to_mongo()
    resume = await get_resume_from_db(candidate_email)
    if not resume:
        return ""
    pdf_stream = io.BytesIO(resume)
    reader = PdfReader(pdf_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text.strip())
    return text.strip()

if __name__ == "__main__":
    asyncio.run(extract_text_from_resume())
