from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
filters_collection = db.filters
video_sessions_collection = db.video_sessions
matches_collection = db.matches
messages_collection = db.messages
complaints_collection = db.complaints
subscriptions_collection = db.subscriptions
daily_communications_collection = db.daily_communications

async def close_db():
    client.close()
