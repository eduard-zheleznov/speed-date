from fastapi import APIRouter, HTTPException, Depends
from models import ComplaintCreate, Complaint
from auth import get_current_user_id
from database import complaints_collection, users_collection

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=Complaint)
async def create_complaint(complaint_data: ComplaintCreate, user_id: str = Depends(get_current_user_id)):
    # Verify reported user exists
    reported_user = await users_collection.find_one({"id": complaint_data.reported_user_id}, {"_id": 0})
    if not reported_user:
        raise HTTPException(status_code=404, detail="Reported user not found")
    
    complaint = Complaint(
        complainant_id=user_id,
        reported_user_id=complaint_data.reported_user_id,
        reason=complaint_data.reason
    )
    
    complaint_dict = complaint.model_dump()
    complaint_dict["created_at"] = complaint_dict["created_at"].isoformat()
    
    await complaints_collection.insert_one(complaint_dict)
    
    # Increment complaint count for reported user
    await users_collection.update_one(
        {"id": complaint_data.reported_user_id},
        {"$inc": {"complaint_count": 1}}
    )
    
    return complaint
