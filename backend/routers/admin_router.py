from fastapi import APIRouter, HTTPException, Depends
from models import User, Complaint
from auth import get_current_user_id
from database import (
    users_collection, complaints_collection, video_sessions_collection,
    matches_collection, daily_communications_collection, subscriptions_settings_collection
)
from datetime import datetime
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])

# Simple admin check - in production, add proper role-based auth
async def is_admin(user_id: str = Depends(get_current_user_id)):
    # For now, check if email contains 'admin'
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user or "admin" not in user.get("email", "").lower():
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id

@router.get("/users", response_model=List[User])
async def get_all_users(admin_id: str = Depends(is_admin)):
    users = await users_collection.find({}, {"_id": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
        if isinstance(user.get("last_login"), str):
            user["last_login"] = datetime.fromisoformat(user["last_login"])
    
    return [User(**user) for user in users]

@router.get("/user/{user_id}", response_model=User)
async def get_user_details(user_id: str, admin_id: str = Depends(is_admin)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)

@router.put("/user/{user_id}/block")
async def block_user(user_id: str, blocked: bool, admin_id: str = Depends(is_admin)):
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"blocked": blocked}}
    )
    
    # TODO: Send email notification to user
    
    return {"message": f"User {'blocked' if blocked else 'unblocked'} successfully"}

@router.delete("/user/{user_id}")
async def delete_user(user_id: str, admin_id: str = Depends(is_admin)):
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user and related data
    await users_collection.delete_one({"id": user_id})
    await complaints_collection.delete_many({"$or": [{"complainant_id": user_id}, {"reported_user_id": user_id}]})
    await video_sessions_collection.delete_many({"$or": [{"user1_id": user_id}, {"user2_id": user_id}]})
    await matches_collection.delete_many({"$or": [{"user1_id": user_id}, {"user2_id": user_id}]})
    await daily_communications_collection.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@router.get("/complaints", response_model=List[Complaint])
async def get_all_complaints(admin_id: str = Depends(is_admin)):
    complaints = await complaints_collection.find({}, {"_id": 0}).to_list(1000)
    
    for complaint in complaints:
        if isinstance(complaint.get("created_at"), str):
            complaint["created_at"] = datetime.fromisoformat(complaint["created_at"])
    
    return [Complaint(**c) for c in complaints]

@router.get("/stats")
async def get_stats(admin_id: str = Depends(is_admin)):
    total_users = await users_collection.count_documents({})
    blocked_users = await users_collection.count_documents({"blocked": True})
    total_matches = await matches_collection.count_documents({})
    active_matches = await matches_collection.count_documents({"active": True})
    total_sessions = await video_sessions_collection.count_documents({})
    total_complaints = await complaints_collection.count_documents({})
    
    return {
        "total_users": total_users,
        "blocked_users": blocked_users,
        "total_matches": total_matches,
        "active_matches": active_matches,
        "total_video_sessions": total_sessions,
        "total_complaints": total_complaints
    }

@router.post("/subscription/activate")
async def activate_subscription_for_user(user_id: str, communications: int, admin_id: str = Depends(is_admin)):
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    today = datetime.now().date().isoformat()
    
    await daily_communications_collection.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {"premium_count": communications}},
        upsert=True
    )
    
    return {"message": f"Added {communications} communications to user {user_id}"}

@router.put("/subscription/toggle")
async def toggle_subscription_plan(plan_name: str, enabled: bool, admin_id: str = Depends(is_admin)):
    """Toggle a subscription plan on or off"""
    await subscriptions_settings_collection.update_one(
        {"plan_name": plan_name},
        {"$set": {"enabled": enabled, "updated_at": datetime.now().isoformat()}},
        upsert=True
    )
    
    return {"message": f"Plan {plan_name} {'enabled' if enabled else 'disabled'}"}
