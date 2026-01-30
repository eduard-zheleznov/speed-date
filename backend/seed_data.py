# Скрипт для создания начальных данных (супер-админ, документы)
import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from datetime import datetime, timezone
import os

# HTML реквизитов
REQUISITES_HTML = '''<div style="max-width: 800px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Реквизиты</h2>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #4CAF50; margin-top: 0;">Получатель платежа</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold; width: 200px;">ФИО:</td>
        <td style="padding: 10px 0;">Игнатов Сергей Алексеевич</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold;">Статус:</td>
        <td style="padding: 10px 0;">Самозанятый</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold;">ИНН:</td>
        <td style="padding: 10px 0;">711180070072</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold;">ОГРНИП:</td>
        <td style="padding: 10px 0;">102770013219500</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold;">Вид деятельности:</td>
        <td style="padding: 10px 0;">Информационные услуги</td>
      </tr>
    </table>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #4CAF50; margin-top: 0;">Банковские реквизиты</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold; width: 200px;">Банк:</td>
        <td style="padding: 10px 0;">ПАО Сбербанк</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-weight: bold;">БИК:</td>
        <td style="padding: 10px 0;">044525225</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold;">Расчётный счёт:</td>
        <td style="padding: 10px 0;">40817810938115981337</td>
      </tr>
    </table>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #4CAF50; margin-top: 0;">Адрес регистрации</h3>
    <p style="margin: 0;">140317, Россия, Московская область, г. Егорьевск, с. Никиткино, д. 112</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
    <h3 style="color: #4CAF50; margin-top: 0;">Контакты</h3>
    <p style="margin: 0;">Email: <a href="mailto:info@speed-date.ru" style="color: #4CAF50;">info@speed-date.ru</a></p>
  </div>
</div>'''

AGREEMENT_HTML = '''<div style="max-width: 800px; margin: 0 auto; padding: 20px;">
<h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Пользовательское соглашение</h2>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h3 style="color: #4CAF50;">1. Общие положения</h3>
<p>1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между администрацией сервиса Speed Date (далее — Администрация) и пользователем сети Интернет (далее — Пользователь).</p>
<p>1.2. Сервис Speed Date предоставляет услуги видео-знакомств для совершеннолетних пользователей.</p>
<p>1.3. Используя сервис, Пользователь подтверждает своё совершеннолетие и согласие с условиями настоящего Соглашения.</p>
</div>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h3 style="color: #4CAF50;">2. Предмет соглашения</h3>
<p>2.1. Предметом настоящего Соглашения является предоставление Пользователю доступа к сервису видео-знакомств.</p>
<p>2.2. Сервис предоставляет Пользователю следующие возможности:</p>
<ul>
<li>Создание личного профиля</li>
<li>Поиск и подбор собеседников по заданным критериям</li>
<li>Видео-общение с другими пользователями (10 минут)</li>
<li>Текстовый чат после взаимного согласия (30 дней)</li>
<li>Платные подписки с расширенными возможностями</li>
</ul>
</div>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h3 style="color: #4CAF50;">3. Права и обязанности сторон</h3>
<p><strong>3.1. Пользователь обязуется:</strong></p>
<ul>
<li>Предоставлять достоверную информацию о себе</li>
<li>Не нарушать права других пользователей</li>
<li>Соблюдать правила сервиса и нормы этики</li>
<li>Не использовать сервис в противоправных целях</li>
</ul>
<p><strong>3.2. Администрация обязуется:</strong></p>
<ul>
<li>Обеспечивать работоспособность сервиса</li>
<li>Защищать персональные данные пользователей</li>
<li>Рассматривать жалобы пользователей</li>
</ul>
</div>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h3 style="color: #4CAF50;">4. Платные услуги</h3>
<p>4.1. Сервис предоставляет платные подписки с расширенными возможностями.</p>
<p>4.2. Оплата производится в соответствии с выбранным тарифом.</p>
<p>4.3. Возврат средств осуществляется в соответствии с законодательством РФ.</p>
</div>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h3 style="color: #4CAF50;">5. Ответственность</h3>
<p>5.1. Администрация не несёт ответственности за содержание сообщений пользователей.</p>
<p>5.2. Пользователь несёт полную ответственность за свои действия на сервисе.</p>
</div>

<div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
<h3 style="color: #4CAF50;">6. Заключительные положения</h3>
<p>6.1. Настоящее Соглашение вступает в силу с момента регистрации Пользователя.</p>
<p>6.2. Администрация оставляет за собой право изменять условия Соглашения.</p>
<p style="margin-top: 20px; color: #666;"><em>Дата последнего обновления: январь 2025</em></p>
</div>
</div>'''


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


async def create_documents(db):
    """Создает документы (реквизиты, соглашение) если их нет"""
    documents = [
        {
            "id": "requisites",
            "title": "Реквизиты",
            "content": REQUISITES_HTML
        },
        {
            "id": "agreement", 
            "title": "Пользовательское соглашение",
            "content": AGREEMENT_HTML
        }
    ]
    
    for doc in documents:
        existing = await db.documents.find_one({"id": doc["id"]})
        if not existing:
            await db.documents.insert_one(doc)
            print(f"✓ Документ создан: {doc['title']}")
        else:
            # Обновляем если уже есть
            await db.documents.update_one(
                {"id": doc["id"]},
                {"$set": {"content": doc["content"], "title": doc["title"]}}
            )
            print(f"✓ Документ обновлён: {doc['title']}")


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
    
    # Создаем документы
    await create_documents(db)
    
    print("\n✓ Начальные данные готовы!")
    print("  Супер-админ: admin@test.com / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
