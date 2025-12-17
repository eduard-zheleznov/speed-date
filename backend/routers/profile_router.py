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

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    # Read file
    contents = await file.read()
    
    # Convert to base64
    base64_image = base64.b64encode(contents).decode('utf-8')
    photo_url = f"data:{file.content_type};base64,{base64_image}"
    
    # Get user
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add photo (max 3)
    photos = user_dict.get("photos", [])
    if len(photos) >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 photos allowed")
    
    photos.append(photo_url)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photo_url": photo_url, "photos": photos}

@router.delete("/photo/{photo_index}")
async def delete_photo(photo_index: int, user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    photos = user_dict.get("photos", [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=400, detail="Invalid photo index")
    
    photos.pop(photo_index)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photos": photos}

@router.post("/set-main-photo")
async def set_main_photo(photo_index: int, user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    photos = user_dict.get("photos", [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=400, detail="Invalid photo index")
    
    # Move selected photo to first position
    main_photo = photos.pop(photo_index)
    photos.insert(0, main_photo)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photos": photos}

    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)
