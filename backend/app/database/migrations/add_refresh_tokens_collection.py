"""
Database migration script to add the refresh tokens collection.
This script creates the refresh_tokens collection and adds necessary indexes.
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Collection name
REFRESH_TOKENS_COLLECTION = "refresh_tokens"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def create_refresh_tokens_collection():
    """
    Create the refresh_tokens collection and add indexes
    """
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Check if collection exists
    collections = await db.list_collection_names()
    if REFRESH_TOKENS_COLLECTION in collections:
        logger.info(f"Collection {REFRESH_TOKENS_COLLECTION} already exists")
    else:
        # Create the collection
        await db.create_collection(REFRESH_TOKENS_COLLECTION)
        logger.info(f"Collection {REFRESH_TOKENS_COLLECTION} created")
    # Create indexes
    # Index on jti (token ID) for fast lookups
    await db[REFRESH_TOKENS_COLLECTION].create_index("jti", unique=True)
    # Index on token for fast lookups
    await db[REFRESH_TOKENS_COLLECTION].create_index("token", unique=True)
    # Index on admin_id to find all tokens for a user
    # Index on admin_id to find all tokens for a user
    await db[REFRESH_TOKENS_COLLECTION].create_index("admin_id")
    # Index on expires_at for cleaning up expired tokens
    await db[REFRESH_TOKENS_COLLECTION].create_index("expires_at")
    # Index on created_at for sorting
    await db[REFRESH_TOKENS_COLLECTION].create_index("created_at")
    
    logger.info(f"Indexes created for {REFRESH_TOKENS_COLLECTION} collection")
    
    # Close the connection
    client.close()
    logger.info("Connection closed")

async def main():
    """
    Main function to run the migration
    """
    logger.info("Starting migration to add refresh_tokens collection")
    
    try:
        await create_refresh_tokens_collection()
        logger.info("Migration completed successfully")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise
    
if __name__ == "__main__":
    asyncio.run(main())