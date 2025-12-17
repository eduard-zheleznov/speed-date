from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import User, ProfileUpdate
from auth import get_current_user_id
from database import users_collection
from datetime import datetime
import base64
import uuid

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=User)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)

@router.put("", response_model=User)
async def update_profile(profile_data: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if update_dict:
        # Check if profile is now complete
        user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
        if user_dict:
            user_dict.update(update_dict)
            required_fields = ["name", "age", "height", "weight", "gender", "education", "smoking", "city"]
            profile_completed = all(user_dict.get(field) is not None for field in required_fields)
            update_dict["profile_completed"] = profile_completed
        
        await users_collection.update_one(
            {"id": user_id},
            {"$set": update_dict}
        )
    
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)
