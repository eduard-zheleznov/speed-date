from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import db
from routers.admin_router import is_super_admin

router = APIRouter(prefix="/documents", tags=["documents"])

# Collection for storing documents
documents_collection = db["documents"]

class DocumentUpdate(BaseModel):
    content: str

class Document(BaseModel):
    id: str
    title: str
    content: str

# Default document templates
DEFAULT_DOCUMENTS = {
    "requisites": {
        "title": "Реквизиты",
        "content": """<h2>Реквизиты</h2>
<p><strong>ИП Иванов Иван Иванович</strong></p>
<p>ИНН: 000000000000</p>
<p>ОГРНИП: 000000000000000</p>
<p>Адрес: г. Москва, ул. Примерная, д. 1</p>
<p>Email: info@speed-date.ru</p>
<p>Телефон: +7 (000) 000-00-00</p>
<hr>
<p><em>Данные будут обновлены после регистрации юридического лица.</em></p>"""
    },
    "agreement": {
        "title": "Пользовательское соглашение",
        "content": """<h2>Пользовательское соглашение</h2>
<p><strong>1. Общие положения</strong></p>
<p>1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между администрацией сервиса Speed Date (далее — Администрация) и пользователем сети Интернет (далее — Пользователь).</p>
<p>1.2. Сервис Speed Date предоставляет услуги видео-знакомств для совершеннолетних пользователей.</p>

<p><strong>2. Предмет соглашения</strong></p>
<p>2.1. Предметом настоящего Соглашения является предоставление Пользователю доступа к сервису видео-знакомств.</p>
<p>2.2. Сервис предоставляет Пользователю следующие возможности:</p>
<ul>
<li>Создание личного профиля</li>
<li>Поиск и подбор собеседников</li>
<li>Видео-общение с другими пользователями</li>
<li>Текстовый чат после взаимного согласия</li>
</ul>

<p><strong>3. Права и обязанности сторон</strong></p>
<p>3.1. Пользователь обязуется:</p>
<ul>
<li>Предоставлять достоверную информацию о себе</li>
<li>Не нарушать права других пользователей</li>
<li>Соблюдать правила сервиса</li>
</ul>

<p><strong>4. Ответственность</strong></p>
<p>4.1. Администрация не несёт ответственности за содержание сообщений пользователей.</p>

<p><strong>5. Заключительные положения</strong></p>
<p>5.1. Настоящее Соглашение вступает в силу с момента регистрации Пользователя на сервисе.</p>
<p>5.2. Администрация оставляет за собой право изменять условия Соглашения.</p>

<hr>
<p><em>Дата последнего обновления: январь 2025</em></p>"""
    }
}

@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get document by ID (public endpoint)"""
    if doc_id not in ["requisites", "agreement"]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = await documents_collection.find_one({"id": doc_id}, {"_id": 0})
    
    if not doc:
        # Return default document
        default = DEFAULT_DOCUMENTS.get(doc_id)
        if default:
            return {"id": doc_id, **default}
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc

@router.put("/{doc_id}")
async def update_document(doc_id: str, data: DocumentUpdate, admin_id: str = Depends(is_super_admin)):
    """Update document (super admin only)"""
    if doc_id not in ["requisites", "agreement"]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    title = DEFAULT_DOCUMENTS[doc_id]["title"]
    
    await documents_collection.update_one(
        {"id": doc_id},
        {"$set": {"id": doc_id, "title": title, "content": data.content}},
        upsert=True
    )
    
    return {"message": "Document updated", "id": doc_id}

@router.get("")
async def get_all_documents():
    """Get all documents (for footer links)"""
    result = []
    for doc_id in ["requisites", "agreement"]:
        doc = await documents_collection.find_one({"id": doc_id}, {"_id": 0})
        if doc:
            result.append({"id": doc_id, "title": doc.get("title", DEFAULT_DOCUMENTS[doc_id]["title"])})
        else:
            result.append({"id": doc_id, "title": DEFAULT_DOCUMENTS[doc_id]["title"]})
    return result
