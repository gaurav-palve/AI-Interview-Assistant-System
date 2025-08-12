from ..database import get_database, SCHEDULED_INTERVIEWS_COLLECTION
from ..models.interview_model import interview_dict
from ..schemas.interview_schema import InterviewCreate, InterviewUpdate, InterviewStatus
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..utils.logger import get_logger

logger = get_logger(__name__)

class InterviewService:
    def __init__(self):
        self.db = get_database()
    
    async def create_interview(self, interview_data: InterviewCreate, created_by: str) -> str:
        """Create a new interview with proper validation and logic"""
        try:
            # Validate scheduled datetime is in the future
            # Ensure the scheduled datetime is timezone-aware
            scheduled_dt = interview_data.scheduled_datetime
            if scheduled_dt.tzinfo is None:
                # If naive, assume it's in UTC
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
                
            if scheduled_dt <= datetime.now(timezone.utc):
                raise ValueError("Interview must be scheduled for a future date and time")
            
            # Create interview document
            interview_doc = {
                "candidate_name": interview_data.candidate_name,
                "candidate_email": interview_data.candidate_email,
                "job_role": interview_data.job_role,
                "scheduled_datetime": interview_data.scheduled_datetime,
                "status": interview_data.status,
                "resume_uploaded": interview_data.resume_uploaded,
                "jd_uploaded": interview_data.jd_uploaded,
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "metadata": {
                    "total_questions": 0,  # Will be populated by dynamic question system
                    "estimated_difficulty": "medium"
                }
            }
            
            # Insert into database
            result = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].insert_one(interview_doc)
            interview_id = str(result.inserted_id)
            
            # Note: Email generation will be handled by OpenAI LLM
            logger.info(f"Interview scheduled successfully: {interview_id} by {created_by} for {interview_data.candidate_email}")
            return interview_id
            
        except Exception as e:
            logger.error(f"Error creating interview: {e}")
            raise
    
    async def get_interview(self, interview_id: str) -> Optional[Dict[str, Any]]:
        """Get interview by ID"""
        try:
            if not ObjectId.is_valid(interview_id):
                return None
            
            interview = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].find_one({"_id": ObjectId(interview_id)})
            if interview:
                interview["id"] = str(interview["_id"])
                return interview
            return None
        except Exception as e:
            logger.error(f"Error getting interview {interview_id}: {e}")
            raise
    
    async def get_interviews_by_creator(self, created_by: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """Get interviews created by a specific user with pagination"""
        try:
            skip = (page - 1) * page_size
            
            # Get total count
            total = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].count_documents({"created_by": created_by})
            
            # Get interviews with pagination
            cursor = self.db[SCHEDULED_INTERVIEWS_COLLECTION].find({"created_by": created_by})
            cursor = cursor.sort("created_at", -1).skip(skip).limit(page_size)
            
            interviews = []
            async for interview in cursor:
                interview["id"] = str(interview["_id"])
                interviews.append(interview)
            
            return {
                "interviews": interviews,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error(f"Error getting interviews for {created_by}: {e}")
            raise
    
    async def update_interview(self, interview_id: str, update_data: InterviewUpdate, updated_by: str) -> bool:
        """Update interview with validation"""
        try:
            if not ObjectId.is_valid(interview_id):
                return False
            
            # Get current interview
            current_interview = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].find_one({"_id": ObjectId(interview_id)})
            if not current_interview:
                return False
            
            # Check if user can update this interview
            if current_interview["created_by"] != updated_by:
                logger.warning(f"User {updated_by} attempted to update interview {interview_id} created by {current_interview['created_by']}")
                return False
            
            # Prepare update data
            update_fields = {}
            
            if update_data.candidate_name is not None:
                update_fields["candidate_name"] = update_data.candidate_name
            
            if update_data.candidate_email is not None:
                update_fields["candidate_email"] = update_data.candidate_email
            
            if update_data.job_role is not None:
                update_fields["job_role"] = update_data.job_role
            
            if update_data.scheduled_datetime is not None:
                # Validate scheduled datetime is in the future
                # Ensure the scheduled datetime is timezone-aware
                scheduled_dt = update_data.scheduled_datetime
                if scheduled_dt.tzinfo is None:
                    # If naive, assume it's in UTC
                    scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
                    
                if scheduled_dt <= datetime.now(timezone.utc):
                    raise ValueError("Interview must be scheduled for a future date and time")
                update_fields["scheduled_datetime"] = scheduled_dt
            
            if update_data.status is not None:
                update_fields["status"] = update_data.status
            
            if update_data.resume_uploaded is not None:
                update_fields["resume_uploaded"] = update_data.resume_uploaded
            
            if update_data.jd_uploaded is not None:
                update_fields["jd_uploaded"] = update_data.jd_uploaded
            
            # Add timestamp
            update_fields["updated_at"] = datetime.now(timezone.utc)
            
            # Update database
            result = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].update_one(
                {"_id": ObjectId(interview_id)},
                {"$set": update_fields}
            )
            
            if result.modified_count > 0:
                logger.info(f"Interview {interview_id} updated successfully by {updated_by}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error updating interview {interview_id}: {e}")
            raise
    
    async def delete_interview(self, interview_id: str, deleted_by: str) -> bool:
        """Delete interview with permission check"""
        try:
            if not ObjectId.is_valid(interview_id):
                return False
            
            # Check if user can delete this interview
            current_interview = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].find_one({"_id": ObjectId(interview_id)})
            if not current_interview:
                return False
            
            if current_interview["created_by"] != deleted_by:
                logger.warning(f"User {deleted_by} attempted to delete interview {interview_id} created by {current_interview['created_by']}")
                return False
            
            # Only allow deletion of draft interviews
            if current_interview["status"] != InterviewStatus.DRAFT:
                raise ValueError("Only draft interviews can be deleted")
            
            result = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].delete_one({"_id": ObjectId(interview_id)})
            
            if result.deleted_count > 0:
                logger.info(f"Interview {interview_id} deleted successfully by {deleted_by}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting interview {interview_id}: {e}")
            raise
    
    async def get_interview_statistics(self, created_by: str) -> Dict[str, Any]:
        """Get interview statistics for a user"""
        try:
            pipeline = [
                {"$match": {"created_by": created_by}},
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            stats = await self.db[SCHEDULED_INTERVIEWS_COLLECTION].aggregate(pipeline).to_list(None)
            
            # Calculate additional statistics
            total_interviews = sum(stat["count"] for stat in stats)
            status_breakdown = {stat["_id"]: stat["count"] for stat in stats}
            
            # Get counts for specific statuses
            scheduled_count = status_breakdown.get("scheduled", 0)
            completed_count = status_breakdown.get("completed", 0)
            draft_count = status_breakdown.get("draft", 0)
            
            return {
                "total_interviews": total_interviews,
                "scheduled_count": scheduled_count,
                "completed_count": completed_count,
                "status_breakdown": status_breakdown
            }
        except Exception as e:
            logger.error(f"Error getting interview statistics for {created_by}: {e}")
            raise
