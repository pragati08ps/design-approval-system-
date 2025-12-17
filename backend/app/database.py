"""
Database connection and GridFS configuration for MongoDB.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from app.config import settings

# MongoDB client (will be initialized on startup)
motor_client: AsyncIOMotorClient = None
database = None
gridfs_bucket: AsyncIOMotorGridFSBucket = None


async def connect_to_mongo():
    """Connect to MongoDB and initialize GridFS bucket."""
    global motor_client, database, gridfs_bucket

    motor_client = AsyncIOMotorClient(settings.mongodb_uri)
    database = motor_client[settings.database_name]
    gridfs_bucket = AsyncIOMotorGridFSBucket(database)

    print(f"✅ Connected to MongoDB: {settings.database_name}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global motor_client

    if motor_client:
        motor_client.close()
        print("❌ Closed MongoDB connection")


def get_database():
    """Get database instance."""
    return database


def get_gridfs_bucket():
    """Get GridFS bucket instance."""
    return gridfs_bucket
