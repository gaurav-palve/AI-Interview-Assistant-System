from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid
from bson import ObjectId
from fastapi import HTTPException
from ..database import get_database, USERS_COLLECTION
from ..utils.logger import get_logger
from ..utils.password_handler import hash_password
from app.services.email_service import EmailService
logger = get_logger(__name__)


class UserService:
    def __init__(self):
        self.db = get_database()

    async def create_user(
        self,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        hashed_password: str,
        role_id: str,
        employee_id: str,
        department: str,
        location: str,
        reporting_manager: str,
        created_by: str,
        middle_name: Optional[str] = None
    ) -> str:
        """
        Create a new user
        """
        logger.info(f"Creating user with email: {email}")

        try:
            # Check if email already exists
            existing_user = await self.db[USERS_COLLECTION].find_one(
                {"email": email.lower().strip()}
            )
            if existing_user:
                logger.warning(f"Email already registered: {email}")
                raise HTTPException(status_code=400, detail="Email already registered")


            user_doc = {
                "first_name": first_name.strip(),
                "middle_name": middle_name.strip() if middle_name else None,
                "last_name": last_name.strip(),
                "email": email.strip().lower(),
                "phone": phone.strip(),
                "hashed_password": hash_password(hashed_password),
                "role_id": role_id,
                "employee_id": employee_id,
                "department": department.strip(),
                "location": location.strip(),
                "reporting_manager": reporting_manager,
                "is_active": True,
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc),
                "updated_at": None
            }

            result = await self.db[USERS_COLLECTION].insert_one(user_doc)
            user_id = str(result.inserted_id)

            if not result.acknowledged:
                logger.error("MongoDB insert not acknowledged")
                raise RuntimeError("User creation failed")

            logger.info(f"User created successfully: {user_id}")

            await EmailService().send_user_credentials_email(\
                user_email=email,
                user_name=f"{first_name} {last_name}",
                temp_password=hashed_password
            )
            return user_id

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user {email}: {e}")
            logger.exception("Full exception details:")
            raise RuntimeError("Failed to create user")
        
    

    async def update_user(
        self,
        user_id: str,
        first_name: Optional[str] = None,
        middle_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        hashed_password: Optional[str] = None,
        role_id: Optional[str] = None,
        employee_id: Optional[str] = None,
        department: Optional[str] = None,
        location: Optional[str] = None,
        reporting_manager: Optional[str] = None,
        is_active: Optional[bool] = None,
        updated_by: Optional[str] = None
    ) -> bool:
        """
        Update user details (aligned with create_user)
        """
        logger.info(f"Updating user: {user_id}")

        try:
            if not ObjectId.is_valid(user_id):
                raise HTTPException(status_code=400, detail="Invalid user ID")

            update_fields: Dict[str, Any] = {}

            if first_name is not None:
                update_fields["first_name"] = first_name.strip()

            if middle_name is not None:
                update_fields["middle_name"] = middle_name.strip()

            if last_name is not None:
                update_fields["last_name"] = last_name.strip()

            if phone is not None:
                update_fields["phone"] = phone.strip()

            if role_id is not None:
                update_fields["role_id"] = role_id

            if employee_id is not None:
                update_fields["employee_id"] = employee_id.strip()

            if department is not None:
                update_fields["department"] = department.strip()

            if location is not None:
                update_fields["location"] = location.strip()

            if reporting_manager is not None:
                update_fields["reporting_manager"] = reporting_manager

            if is_active is not None:
                update_fields["is_active"] = is_active

            if hashed_password is not None:
                update_fields["hashed_password"] = hash_password(hashed_password)

            if updated_by is not None:
                update_fields["updated_by"] = updated_by

            if not update_fields:
                raise HTTPException(
                    status_code=400,
                    detail="No fields provided to update"
                )

            update_fields["updated_at"] = datetime.now(timezone.utc)

            result = await self.db[USERS_COLLECTION].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_fields}
            )

            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="User not found")

            logger.info(f"User updated successfully: {user_id}")
            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {e}")
            logger.exception("Full exception details:")
            raise RuntimeError("Failed to update user")


    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user
        """
        logger.info(f"Deleting user: {user_id}")

        try:
            result = await self.db[USERS_COLLECTION].delete_one(
                {"_id": ObjectId(user_id)}
            )

            if result.deleted_count == 0:
                logger.warning(f"User not found for deletion: {user_id}")
                raise HTTPException(status_code=404, detail="User not found")

            logger.info(f"User deleted successfully: {user_id}")
            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {e}")
            logger.exception("Full exception details:")
            raise RuntimeError("Failed to delete user")
