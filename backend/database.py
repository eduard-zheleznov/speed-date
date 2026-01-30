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
subscriptions_settings_collection = db.subscriptions_settings
user_subscriptions_collection = db.user_subscriptions
subscription_history_collection = db.subscription_history
feedback_collection = db.feedback

async def close_db():
    client.close()

async def get_db():
    """Return database instance"""
    return db
