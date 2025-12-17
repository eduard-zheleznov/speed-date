# Скрипт для создания тестовых пользователей
import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from datetime import datetime, timezone
import os

async def seed_database():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Test users
    test_users = [
        {
            "id": "test-user-1",
            "email": "alice@test.com",
            "name": "Алиса",
            "age": 25,
            "height": 165,
            "weight": 55,
            "gender": "female",
            "education": "higher",
            "smoking": "negative",
            "city": "Moscow",
            "description": "Люблю путешествия и новые знакомства",
            "photos": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "blocked": False,
            "complaint_count": 0,
            "profile_completed": True,
            "password_hash": get_password_hash("test123")
        },
        {
            "id": "test-user-2",
            "email": "bob@test.com",
            "name": "Боб",
            "age": 28,
            "height": 180,
            "weight": 75,
            "gender": "male",
            "education": "higher",
            "smoking": "neutral",
            "city": "Moscow",
            "description": "Интересуюсь спортом и технологиями",
            "photos": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "blocked": False,
            "complaint_count": 0,
            "profile_completed": True,
            "password_hash": get_password_hash("test123")
        },
        {
            "id": "test-user-3",
            "email": "maria@test.com",
            "name": "Мария",
            "age": 30,
            "height": 170,
            "weight": 60,
            "gender": "female",
            "education": "vocational",
            "smoking": "negative",
            "city": "Moscow",
            "description": "Творческая натура, люблю искусство",
            "photos": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "blocked": False,
            "complaint_count": 0,
            "profile_completed": True,
            "password_hash": get_password_hash("test123")
        }
    ]
    
    # Test filters
    test_filters = [
        {
            "user_id": "test-user-1",
            "age_range": "25-35",
            "gender_preference": "male",
            "city": "Moscow",
            "smoking_preference": "negative",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "test-user-2",
            "age_range": "25-35",
            "gender_preference": "female",
            "city": "Moscow",
            "smoking_preference": "any",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "test-user-3",
            "age_range": "25-35",
            "gender_preference": "male",
            "city": "Moscow",
            "smoking_preference": "negative",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Clear existing test data
    await db.users.delete_many({"id": {"$in": ["test-user-1", "test-user-2", "test-user-3"]}})
    await db.filters.delete_many({"user_id": {"$in": ["test-user-1", "test-user-2", "test-user-3"]}})
    
    # Insert test data
    await db.users.insert_many(test_users)
    await db.filters.insert_many(test_filters)
    
    print("✓ Тестовые пользователи созданы:")
    print("  alice@test.com / test123")
    print("  bob@test.com / test123")
    print("  maria@test.com / test123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
