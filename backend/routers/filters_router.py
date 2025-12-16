from fastapi import APIRouter, HTTPException, Depends
from models import Filters, FiltersUpdate
from auth import get_current_user_id
from database import filters_collection
from datetime import datetime, timezone

router = APIRouter(prefix="/filters", tags=["filters"])

@router.get("", response_model=Filters)
async def get_filters(user_id: str = Depends(get_current_user_id)):
    filters_dict = await filters_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not filters_dict:
        # Return default filters
        return Filters(
            user_id=user_id,
            age_range="25-35",
            gender_preference="female",
            city="Moscow",
            smoking_preference="negative"
        )
    
    if isinstance(filters_dict.get("updated_at"), str):
        filters_dict["updated_at"] = datetime.fromisoformat(filters_dict["updated_at"])
    
    return Filters(**filters_dict)

@router.put("", response_model=Filters)
async def update_filters(filters_data: FiltersUpdate, user_id: str = Depends(get_current_user_id)):
    filters = Filters(
        user_id=user_id,
        age_range=filters_data.age_range,
        gender_preference=filters_data.gender_preference,
        city=filters_data.city,
        smoking_preference=filters_data.smoking_preference
    )
    
    filters_dict = filters.model_dump()
    filters_dict["updated_at"] = filters_dict["updated_at"].isoformat()
    
    await filters_collection.update_one(
        {"user_id": user_id},
        {"$set": filters_dict},
        upsert=True
    )
    
    return filters
