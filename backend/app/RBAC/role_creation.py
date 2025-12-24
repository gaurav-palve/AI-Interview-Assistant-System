from app.database import ROLES_COLLECTION,get_database
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)



async def create_role(
    role_name: str,
    description: str,
    created_by: str= None,
    is_active: bool = True,
    permissions: list = []
):
    try:
        db = get_database()
        if created_by is None:
            created_by = "system"

        # Check if role already exists
        existing_role = await db[ROLES_COLLECTION].find_one({"role_name": role_name})
        if existing_role:
            logger.info(f"Role {role_name} already exists")
            return {"message": "Role already exists"}

        role_data = {
            "role_name": role_name,
            "description": description,
            "is_active": is_active,
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc),
            "permissions": permissions
        }
        print(role_data)
        print(30*"-")

        data= await db[ROLES_COLLECTION].insert_one(role_data)
        logger.info(f"Created role: {role_name}")
        return str(data.inserted_id)
    
    except Exception as e:
        logger.error(f"Error while creating role {role_name}: {e}")
        return {"message": "Error in create_role function"}


async def update_role(
    role_id: str,
    role_name: str = None,
    description: str = None,
    is_active: bool = None,
    permissions: list = None,
    updated_by: str = None
):
    """
    Update an existing role with new values.
    Only provided values will be updated.
    """
    try:
        db = get_database()
        if updated_by is None:
            updated_by = "system"

        # Check if role exists
        from bson import ObjectId
        existing_role = await db[ROLES_COLLECTION].find_one({"_id": ObjectId(role_id)})
        if not existing_role:
            logger.warning(f"Role with ID {role_id} not found")
            return {"message": "Role not found"}

        # Prepare update data with only provided fields
        update_data = {"updated_at": datetime.now(timezone.utc), "updated_by": updated_by}
        
        if role_name is not None:
            update_data["role_name"] = role_name
        
        if description is not None:
            update_data["description"] = description
        
        if is_active is not None:
            update_data["is_active"] = is_active
        
        if permissions is not None:
            update_data["permissions"] = permissions

        # Update the role
        result = await db[ROLES_COLLECTION].update_one(
            {"_id": ObjectId(role_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            logger.warning(f"No changes made to role {role_id}")
            return {"message": "No changes made"}

        logger.info(f"Updated role: {role_id}")
        return {"message": "Role updated successfully"}
    
    except Exception as e:
        logger.error(f"Error while updating role {role_id}: {e}")
        return {"message": f"Error in update_role function: {str(e)}"}