from fastapi import APIRouter, Depends
from pydantic import BaseModel
from auth import get_current_user_id
from database import feedback_collection
from datetime import datetime, timezone
from typing import Optional
import uuid

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackCreate(BaseModel):
    type: str  # "idea", "suggestion", "bug", "other"
    message: str
    page: Optional[str] = None

class Feedback(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    page: Optional[str] = None
    created_at: str
    status: str = "new"

@router.post("")
async def submit_feedback(feedback: FeedbackCreate, user_id: str = Depends(get_current_user_id)):
    """Submit feedback from user"""
    feedback_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": feedback.type,
        "message": feedback.message,
        "page": feedback.page,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "new"
    }
    
    await feedback_collection.insert_one(feedback_doc)
    
    return {"message": "Спасибо за обратную связь!", "id": feedback_doc["id"]}

@router.get("")
async def get_my_feedback(user_id: str = Depends(get_current_user_id)):
    """Get user's own feedback history"""
    feedbacks = await feedback_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return feedbacks
