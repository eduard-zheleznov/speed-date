# Скрипт для создания начальных данных (супер-админ и тестовые пользователи)
import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from datetime import datetime, timezone
import os

async def create_super_admin(db):
    """Создает супер-админа если его нет"""
    admin_email = "admin@test.com"
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"✓ Супер-админ уже существует: {admin_email}")
        return
    
    admin_user = {
        "id": "super-admin-1",
        "email": admin_email,
        "name": "Администратор",
        "age": 30,
        "height": 175,
        "weight": 70,
        "gender": "male",
        "education": "higher",
        "smoking": "negative",
        "city": "Москва",
        "description": "Администратор системы",
        "photos": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": datetime.now(timezone.utc).isoformat(),
        "blocked": False,
        "complaint_count": 0,
        "profile_completed": True,
        "password_hash": get_password_hash("admin123"),
        "is_admin": True,
        "is_super_admin": True,
        "admin_permissions": ["users", "subscriptions", "complaints", "documents"]
    }
    
    await db.users.insert_one(admin_user)
    print(f"✓ Супер-админ создан: {admin_email} / admin123")

async def create_test_users(db):
    """Создает тестовых пользователей"""
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
            "city": "Москва",
            "description": "Люблю путешествия и новые знакомства",
            "photos": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "blocked": False,
            "complaint_count": 0,
            "profile_completed": True,
            "password_hash": get_password_hash("test123"),
            "is_admin": False,
            "is_super_admin": False
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
            "city": "Москва",
            "description": "Интересуюсь спортом и технологиями",
            "photos": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "blocked": False,
            "complaint_count": 0,
            "profile_completed": True,
            "password_hash": get_password_hash("test123"),
            "is_admin": False,
            "is_super_admin": False
        }
    ]
    
    for user in test_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"✓ Тестовый пользователь создан: {user['email']} / test123")
        else:
            print(f"✓ Пользователь уже существует: {user['email']}")

async def seed_database():
    """Основная функция создания начальных данных"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"Подключение к MongoDB: {mongo_url}")
    print(f"База данных: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Создаем супер-админа
    await create_super_admin(db)
    
    # Создаем тестовых пользователей
    await create_test_users(db)
    
    print("\n✓ Начальные данные готовы!")
    print("  Супер-админ: admin@test.com / admin123")
    print("  Тест: alice@test.com / test123")
    print("  Тест: bob@test.com / test123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
