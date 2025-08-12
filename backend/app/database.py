from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
from gridfs import GridFS
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from .utils.logger import get_logger

logger = get_logger(__name__)

# Define collection names as constants
AUTH_COLLECTION = "auth_collection"
SCHEDULED_INTERVIEWS_COLLECTION = "scheduled_interviews"
CANDIDATE_DOCUMENTS_COLLECTION = "candidate_documents"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI)
        db = client[settings.DB_NAME]
        # Test the connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_database():
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db



async def save_candidate_data(candidate_email, jd_file, resume_file):
    """
    Save candidate documents to GridFS and metadata to the candidate_documents collection
    
    Note: Using AsyncIOMotorGridFSBucket for async GridFS operations
    """
    try:
        db = get_database()
        
        fs = AsyncIOMotorGridFSBucket(db)
        
        # Store files in GridFS
        jd_file_id = await fs.upload_from_stream(
            f"{candidate_email}_jd.pdf",
            jd_file
        )
        
        resume_file_id = await fs.upload_from_stream(
            f"{candidate_email}_resume.pdf",
            resume_file
        )
        
        # Store metadata in the candidate_documents collection
        candidate_data = {
            "candidate_email": candidate_email,
            "jd_file_id": jd_file_id,
            "resume_file_id": resume_file_id,
            "upload_date": datetime.now(timezone.utc)
        }
        
        # Use the constant for collection name
        await db[CANDIDATE_DOCUMENTS_COLLECTION].insert_one(candidate_data)
        logger.info(f"Saved candidate {candidate_email} documents to MongoDB in {CANDIDATE_DOCUMENTS_COLLECTION} collection.")
        return True
    except Exception as e:
        logger.error(f"Error saving data for candidate {candidate_email}: {e}")
        raise




async def get_resume_from_db(candidate_email: str) -> bytes:
    """
    Fetch resume PDF binary from GridFS for a given candidate email.
    """
    db = get_database()
    fs = AsyncIOMotorGridFSBucket(db)

    # Find the document containing file IDs
    candidate_doc = await db[CANDIDATE_DOCUMENTS_COLLECTION].find_one(
        {"candidate_email": candidate_email},
        {"resume_file_id": 1}
    )

    if not candidate_doc or "resume_file_id" not in candidate_doc:
        logger.warning(f"No resume found for candidate: {candidate_email}")
        return None

    # Read file from GridFS
    resume_file_id = candidate_doc["resume_file_id"]
    grid_out = await fs.open_download_stream(resume_file_id)
    resume_data = await grid_out.read()

    return resume_data




async def get_jd_from_db(candidate_email: str) -> bytes:
    """
    Fetch job description PDF binary from GridFS for a given candidate email.
    """
    db = get_database()
    fs = AsyncIOMotorGridFSBucket(db)

    # Find the document containing file IDs
    candidate_doc = await db[CANDIDATE_DOCUMENTS_COLLECTION].find_one(
        {"candidate_email": candidate_email},
        {"jd_file_id": 1}
    )

    if not candidate_doc or "jd_file_id" not in candidate_doc:
        logger.warning(f"No JD found for candidate: {candidate_email}")
        return None

    # Read file from GridFS
    jd_file_id = candidate_doc["jd_file_id"]
    grid_out = await fs.open_download_stream(jd_file_id)
    jd_data = await grid_out.read()

    return jd_data