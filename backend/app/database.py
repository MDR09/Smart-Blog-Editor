"""
Database connection and configuration using Motor (async MongoDB driver)
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smart_blog_editor")

class Database:
    client: AsyncIOMotorClient = None
    
database = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    database.client = AsyncIOMotorClient(MONGODB_URL)
    print(f"Connected to MongoDB at {MONGODB_URL}")

async def close_mongo_connection():
    """Close MongoDB connection"""
    database.client.close()
    print("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return database.client[DATABASE_NAME]

async def create_indexes():
    """Create database indexes for performance"""
    db = get_database()
    
    # Posts collection indexes
    await db.posts.create_index("author_id")
    await db.posts.create_index("status")
    await db.posts.create_index([("author_id", 1), ("status", 1)])
    await db.posts.create_index("updated_at")
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    
    print("Database indexes created successfully")
