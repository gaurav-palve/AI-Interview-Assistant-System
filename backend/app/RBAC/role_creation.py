from app.database import ROLES_COLLECTION,get_database
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)



async def create_role(
    role_name: str,
    description: str,
    created_by: str= None,
    is_active: bool = True
):
    try:
        db = get_database()
        if created_by is None:
            created_by = "system"

        # Check if role already exists
        existing_role = await db[ROLES_COLLECTION].find_one({"name": role_name})
        if existing_role:
            logger.info(f"Role {role_name} already exists")
            return {"message": "Role already exists"}

        role_data = {
            "role_name": role_name,
            "description": description,
            "is_active": is_active,
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc)
        }
        print(role_data)
        print(30*"-")

        data= await db[ROLES_COLLECTION].insert_one(role_data)
        logger.info(f"Created role: {role_name}")
        return str(data.inserted_id)
    
    except Exception as e:
        logger.error(f"Error while creating role {role_name}: {e}")
        return {"message": "Error in create_role function"}

 