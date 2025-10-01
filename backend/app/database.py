from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
from gridfs import GridFS
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from .utils.logger import get_logger
from app.utils.parse_mcqs import parse_mcqs
import uuid
from typing import List, Dict
from bson import ObjectId

logger = get_logger(__name__)

# Define collection names as constants
AUTH_COLLECTION = "auth_collection"
SCHEDULED_INTERVIEWS_COLLECTION = "scheduled_interviews"
CANDIDATE_DOCUMENTS_COLLECTION = "candidate_documents"
MCQS_COLLECTION = "mcqs"
VOICE_INTERVIEW_SESSIONS_COLLECTION = "voice_interview_sessions"
EMAIL_TEMPLATES_COLLECTION = "email_templates"
JOB_DESCRIPTIONS_COLLECTION = "job_descriptions"
JOB_POSTINGS_COLLECTION = "job_postings"
CODING_QUESTIONS_COLLECTION = "coding_questions"

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
        required_collections = [
            AUTH_COLLECTION,
            SCHEDULED_INTERVIEWS_COLLECTION,
            CANDIDATE_DOCUMENTS_COLLECTION,
            MCQS_COLLECTION,
            VOICE_INTERVIEW_SESSIONS_COLLECTION,
            EMAIL_TEMPLATES_COLLECTION,
            JOB_DESCRIPTIONS_COLLECTION,
            JOB_POSTINGS_COLLECTION
        ]
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


# Voice Interview Session Functions

async def create_voice_session(interview_id: str, candidate_id: str) -> dict:
    """Create a new voice interview session"""
    from app.models.voice_interview_model import voice_interview_session_dict

    try:
        db = get_database()

        # Generate a unique session ID
        session_id = str(uuid.uuid4())

        # Create session document
        session = voice_interview_session_dict(
            interview_id=interview_id,
            candidate_id=candidate_id,
            session_id=session_id
        )

        # Insert into database
        await db[VOICE_INTERVIEW_SESSIONS_COLLECTION].insert_one(session)

        logger.info(f"Created voice interview session {session_id}")
        return session
    except Exception as e:
        logger.error(f"Error creating voice session: {str(e)}")
        raise

async def create_voice_session_with_id(interview_id: str, candidate_id: str, session_id: str) -> dict:
    """Create a new voice interview session with a specific session_id"""
    from app.models.voice_interview_model import voice_interview_session_dict
    from bson import ObjectId

    try:
        db = get_database()

        # Create session document with provided session_id
        session = voice_interview_session_dict(
            interview_id=interview_id,
            candidate_id=candidate_id,
            session_id=session_id
        )

        # Add initial metadata
        session["status"] = "active"
        session["started_at"] = datetime.now(timezone.utc)

        # Insert into database
        insert_result = await db[VOICE_INTERVIEW_SESSIONS_COLLECTION].insert_one(session)
        session["_id"] = str(insert_result.inserted_id)  # Convert ObjectId to string

        logger.info(f"Created voice interview session {session_id}")
        return session
    except Exception as e:
        logger.error(f"Error creating voice session with id {session_id}: {str(e)}")
        raise

async def get_voice_session(session_id: str) -> dict:
    """Get a voice interview session by ID"""
    try:
        db = get_database()
        
        session = await db[VOICE_INTERVIEW_SESSIONS_COLLECTION].find_one(
            {"session_id": session_id}
        )
        
        return session
    except Exception as e:
        logger.error(f"Error getting voice session {session_id}: {str(e)}")
        return None

async def update_voice_session(session_id: str, updates: dict) -> dict:
    """Update a voice interview session"""
    from app.models.voice_interview_model import update_voice_session_dict
    
    try:
        db = get_database()
        
        # Get current session
        current_session = await get_voice_session(session_id)
        if not current_session:
            logger.error(f"Session {session_id} not found for update")
            return None
        
        # Create updated session document
        updates["updated_at"] = datetime.now(timezone.utc)
        
        # Update in database
        result = await db[VOICE_INTERVIEW_SESSIONS_COLLECTION].update_one(
            {"session_id": session_id},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            logger.info(f"Updated voice session {session_id}")
            return await get_voice_session(session_id)
        else:
            logger.warning(f"No changes made to voice session {session_id}")
            return current_session
    except Exception as e:
        logger.error(f"Error updating voice session {session_id}: {str(e)}")
        return None

async def get_sessions_by_interview(interview_id: str) -> list:
    """Get all voice sessions for an interview"""
    try:
        db = get_database()
        
        cursor = db[VOICE_INTERVIEW_SESSIONS_COLLECTION].find(
            {"interview_id": interview_id}
        )
        
        sessions = await cursor.to_list(length=100)
        return sessions
    except Exception as e:
        logger.error(f"Error getting sessions for interview {interview_id}: {str(e)}")
        return []
    



async def get_mcq_answers(interview_id: str) -> List[Dict]:
    """
    Fetch candidate MCQ answers for a given interview_id.
    
    Steps:
    1. Fetch interview details (to get candidate name).
    2. Fetch MCQ answers from MCQS_COLLECTION using the interview_id.
    3. Extract question, correct answer, candidate's answer, correctness, and candidate email.
    4. Return structured list of extracted data.
    
    :param interview_id: The ID of the interview to fetch MCQs for.
    :return: List of dictionaries containing candidate answers and related details.
    """
    try:
        db = get_database()
        extracted_data = []

        # Step 1: Get the interview record (fetch candidate name from scheduled interviews)
        interview_record = await db[SCHEDULED_INTERVIEWS_COLLECTION].find_one({"_id": ObjectId(interview_id)})
        if not interview_record:
            logger.warning(f"No record found in {SCHEDULED_INTERVIEWS_COLLECTION} for _id={interview_id}")
            return []  # Exit early if no interview record found

        candidate_name = interview_record.get("candidate_name", "")

        # Step 2: Get MCQ answers for the given interview
        record = await db[MCQS_COLLECTION].find_one({"interview_id": interview_id})
        if not record:
            logger.warning(f"No record found in {MCQS_COLLECTION} for interview_id={interview_id}")
            return []

        candidate_email = record.get("candidate_email", "")
        logger.info(f"Found candidate_email: {candidate_email} for interview_id={interview_id}")
        
        # Add candidate name and email as a separate entry (if needed by frontend/report)
        metadata_entry = {
            "candidate_name": candidate_name,
            "candidate_email": candidate_email
        }
        extracted_data.append(metadata_entry)

        # Step 3: Extract and structure MCQ data
        for mcq in record.get("mcqs_text", []):
            extracted_data.append({
                "interview_id": record.get("interview_id"),
                "question": mcq.get("question"),
                "answer": mcq.get("answer"),
                "candidate_answer": mcq.get("candidate_answer"),
                "is_correct": mcq.get("is_correct"),
                "candidate_email": candidate_email,
                "candidate_name": candidate_name
            })

        # Log success
        logger.info(f"Extracted {len(extracted_data) - 1} MCQs for interview_id={interview_id}")  
        return extracted_data

    except Exception as e:
        logger.error(f"Error fetching candidate answers for interview_id={interview_id}: {e}")
        return []     



async def save_coding_questions(questions, interview_id: str) -> str:
    """
    Save multiple coding questions as a single MongoDB document.

    Args:
        questions: List of Question objects
        interview_id: The ID of the interview session

    Returns:
        Inserted document _id as a string
    """
    db = get_database()
    document = {
        "interview_id": interview_id,
        "created_at": datetime.utcnow(),
        "questions": [q.dict() for q in questions]  # store all questions in one record
    }
    result = await db[CODING_QUESTIONS_COLLECTION].insert_one(document)
    logger.info(f"Saved coding questions for interview_id={interview_id}")
    return str(result.inserted_id)

async def fetch_coding_questions(interview_id: str):
    """
    Fetch coding questions for a specific interview from the database.
    
    Args:
        interview_id: The ID of the interview
        
    Returns:
        List of question objects or None if not found
    """
    try:
        db = get_database()
        document = await db[CODING_QUESTIONS_COLLECTION].find_one({"interview_id": interview_id})
        if not document:
            logger.warning(f"No coding questions found for interview_id={interview_id}")
            return None
        return document.get("questions", [])
    except Exception as e:
        logger.error(f"Error fetching coding questions for interview_id={interview_id}: {e}")
        raise


async def save_coding_round_answers(db, interview_id:str, question_id, candidate_answer, candidate_test_cases):
    """
    Save candidate's answer and test cases into coding_questions collection.

    Args:
        db: MongoDB database instance
        interview_id (str): Interview ID
        question_id (int): Question ID inside questions array
        candidate_answer (str): Candidate's submitted answer
        candidate_test_cases (list): List of test case results (dicts with input, output, result, etc.)
    """
    try:
        result = await db[CODING_QUESTIONS_COLLECTION].update_one(
            {
                "interview_id": interview_id,
                "questions.id": question_id
            },
            {
                "$set": {
                    "questions.$.candidate_answer": candidate_answer,
                    "questions.$.candidate_test_cases": candidate_test_cases
                }
            }
        )

        if result.modified_count > 0:
            logger.info(f"Candidate answer saved successfully.")
        else:
            logger.info(f"No document updated. Please check interview_id and question_id.")
    
    except Exception as e:
        logger.info(f"Error while saving the coding round answers: {e}")
        raise RuntimeError(f"Error in save_coding_round_answers {e}")
