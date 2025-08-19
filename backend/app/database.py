from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
from gridfs import GridFS
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from .utils.logger import get_logger
from app.utils.parse_mcqs import parse_mcqs

logger = get_logger(__name__)

# Define collection names as constants
AUTH_COLLECTION = "auth_collection"
SCHEDULED_INTERVIEWS_COLLECTION = "scheduled_interviews"
CANDIDATE_DOCUMENTS_COLLECTION = "candidate_documents"
MCQS_COLLECTION = "mcqs"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        # Connect with a timeout and retry logic
        logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}")
        client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=10,
            retryWrites=True
        )
        db = client[settings.DB_NAME]
        
        # Test the connection
        logger.info("Testing MongoDB connection...")
        await client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {settings.DB_NAME}")
        
        # Verify collections exist or create them
        collections = await db.list_collection_names()
        logger.info(f"Available collections: {collections}")
        
        # Ensure required collections exist
        required_collections = [AUTH_COLLECTION, SCHEDULED_INTERVIEWS_COLLECTION, CANDIDATE_DOCUMENTS_COLLECTION]
        for collection in required_collections:
            if collection not in collections:
                logger.warning(f"Collection {collection} does not exist. Creating it now.")
                await db.create_collection(collection)
                logger.info(f"Created collection: {collection}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.error("Please ensure MongoDB is running and accessible")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_database():
    if db is None:
        logger.error("Database not initialized. Call connect_to_mongo() first.")
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db

async def verify_database_connection():
    """Verify that the database connection is working properly"""
    if db is None:
        logger.error("Database not initialized. Call connect_to_mongo() first.")
        return False
    
    try:
        # Test the connection
        await client.admin.command('ping')
        
        # Check if collections exist
        collections = await db.list_collection_names()
        logger.info(f"Available collections: {collections}")
        
        # Check if we can read from the interviews collection
        count = await db[SCHEDULED_INTERVIEWS_COLLECTION].count_documents({})
        logger.info(f"Number of interviews in the database: {count}")
        
        return True
    except Exception as e:
        logger.error(f"Database verification failed: {e}")
        return False



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
    try:
        logger.info(f"Fetching resume from database for candidate: {candidate_email}")
        db = get_database()
        fs = AsyncIOMotorGridFSBucket(db)

        # Find the document containing file IDs
        logger.info(f"Querying {CANDIDATE_DOCUMENTS_COLLECTION} for candidate: {candidate_email}")
        candidate_doc = await db[CANDIDATE_DOCUMENTS_COLLECTION].find_one(
            {"candidate_email": candidate_email},
            {"resume_file_id": 1}
        )

        if not candidate_doc:
            logger.warning(f"No document found for candidate: {candidate_email}")
            return None
            
        if "resume_file_id" not in candidate_doc:
            logger.warning(f"No resume_file_id in document for candidate: {candidate_email}")
            return None

        # Read file from GridFS
        resume_file_id = candidate_doc["resume_file_id"]
        logger.info(f"Found resume_file_id: {resume_file_id} for candidate: {candidate_email}")
        
        try:
            grid_out = await fs.open_download_stream(resume_file_id)
            resume_data = await grid_out.read()
            logger.info(f"Successfully retrieved resume data (size: {len(resume_data)} bytes)")
            return resume_data
        except Exception as e:
            logger.error(f"Error retrieving resume file from GridFS: {e}")
            logger.error(f"Resume file ID: {resume_file_id}, Candidate: {candidate_email}")
            return None
    except Exception as e:
        logger.error(f"Error in get_resume_from_db: {e}")
        return None




async def get_jd_from_db(candidate_email: str) -> bytes:
    """
    Fetch job description PDF binary from GridFS for a given candidate email.
    """
    try:
        logger.info(f"Fetching JD from database for candidate: {candidate_email}")
        db = get_database()
        fs = AsyncIOMotorGridFSBucket(db)

        # Find the document containing file IDs
        logger.info(f"Querying {CANDIDATE_DOCUMENTS_COLLECTION} for candidate: {candidate_email}")
        candidate_doc = await db[CANDIDATE_DOCUMENTS_COLLECTION].find_one(
            {"candidate_email": candidate_email},
            {"jd_file_id": 1}
        )

        if not candidate_doc:
            logger.warning(f"No document found for candidate: {candidate_email}")
            return None
            
        if "jd_file_id" not in candidate_doc:
            logger.warning(f"No jd_file_id in document for candidate: {candidate_email}")
            return None

        # Read file from GridFS
        jd_file_id = candidate_doc["jd_file_id"]
        logger.info(f"Found jd_file_id: {jd_file_id} for candidate: {candidate_email}")
        
        try:
            grid_out = await fs.open_download_stream(jd_file_id)
            jd_data = await grid_out.read()
            logger.info(f"Successfully retrieved JD data (size: {len(jd_data)} bytes)")
            return jd_data
        except Exception as e:
            logger.error(f"Error retrieving JD file from GridFS: {e}")
            logger.error(f"JD file ID: {jd_file_id}, Candidate: {candidate_email}")
            return None
    except Exception as e:
        logger.error(f"Error in get_jd_from_db: {e}")
        return None



def save_generated_mcqs(interview_id: str, candidate_email: str, mcqs_text: str) -> bool:
    """
    Save MCQs with unique question_id for easier updates later.
    """
    try:
        logger.info(f"Saving MCQ's for interview ID: {interview_id}")
        db = get_database()

        # Convert response string into list of dicts
        parsed_mcqs = parse_mcqs(mcqs_text)

        # Assign unique question_id
        structured_mcqs = []
        for idx, mcq in enumerate(parsed_mcqs, start=1):
            structured_mcqs.append({
                "question_id": idx,  # ✅ unique identifier
                "question": mcq["question"],
                "answer": mcq["answer"],
                "candidate_answer": None,
                "created_at": datetime.utcnow()
            })

        db[MCQS_COLLECTION].insert_one({
            "interview_id": interview_id,
            "candidate_email": candidate_email,
            "mcqs_text": structured_mcqs,
            "created_at": datetime.utcnow()
        })
        return True
    except Exception as e:
        logger.error(f"Error saving generated MCQs: {e}")
        return False
    


async def save_candidate_answer(interview_id: str, question_id: int, candidate_answer: str, is_correct:bool) -> bool:
    
    try:
        db = get_database()

        result = await db[MCQS_COLLECTION].update_one(
            {
                "interview_id": interview_id,
                "mcqs_text.question_id": question_id # ✅ match by ID
            },
            {
                "$set": {
                    "mcqs_text.$.candidate_answer": candidate_answer,
                    "mcqs_text.$.is_correct":is_correct,
                    "mcqs_text.$.submitted_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count > 0:
            logger.info(f"Saved candidate answer for interview_id={interview_id}, question_id={question_id}")
            return True
        else:
            logger.warning(f"No matching question found for interview_id={interview_id}, question_id={question_id}")
            return False

    except Exception as e:
        logger.error(f"Error saving candidate answer: {e}")
        return False


