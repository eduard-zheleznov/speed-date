from fastapi import APIRouter, HTTPException, Depends
from models import User, Complaint, SubscriptionHistory
from auth import get_current_user_id
from database import (
    users_collection, complaints_collection, video_sessions_collection,
    matches_collection, daily_communications_collection, subscriptions_settings_collection,
    user_subscriptions_collection, subscription_history_collection, feedback_collection
)
from datetime import datetime, timezone, timedelta
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])

SUBSCRIPTION_PLANS = {
    "Серебро": {"price": 490, "communications": 5},
    "Золото": {"price": 990, "communications": 10},
    "VIP": {"price": 1900, "communications": 20}
}

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
        if isinstance(user.get("subscription_activated_at"), str):
            user["subscription_activated_at"] = datetime.fromisoformat(user["subscription_activated_at"])
        if isinstance(user.get("subscription_expires_at"), str):
            user["subscription_expires_at"] = datetime.fromisoformat(user["subscription_expires_at"])
    
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
    await subscription_history_collection.delete_many({"user_id": user_id})
    
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
    active_subscriptions = await users_collection.count_documents({
        "active_subscription": {"$ne": None},
        "subscription_expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    return {
        "total_users": total_users,
        "blocked_users": blocked_users,
        "total_matches": total_matches,
        "active_matches": active_matches,
        "total_video_sessions": total_sessions,
        "total_complaints": total_complaints,
        "active_subscriptions": active_subscriptions
    }

@router.post("/subscription/activate")
async def activate_subscription_for_user(user_id: str, plan_name: str, admin_id: str = Depends(is_admin)):
    """Activate a subscription plan for a user (admin only)"""
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if plan_name not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan name")
    
    plan = SUBSCRIPTION_PLANS[plan_name]
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30)
    
    # Update user's subscription
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {
            "active_subscription": plan_name,
            "subscription_activated_at": now.isoformat(),
            "subscription_expires_at": expires_at.isoformat()
        }}
    )
    
    # Add to subscription history
    history_entry = {
        "id": str(datetime.now().timestamp()),
        "user_id": user_id,
        "plan_name": plan_name,
        "price": plan["price"],
        "communications_per_day": plan["communications"],
        "purchase_date": now.isoformat(),
        "activated_by": "admin"
    }
    await subscription_history_collection.insert_one(history_entry)
    
    # Set daily communications
    today = now.date().isoformat()
    await daily_communications_collection.update_one(
        {"user_id": user_id, "date": today},
        {"$set": {"premium_count": plan["communications"], "free_count": 5, "used_count": 0}},
        upsert=True
    )
    
    return {"message": f"Тариф {plan_name} активирован на 1 месяц", "expires_at": expires_at.isoformat()}

@router.get("/subscription/history/{user_id}")
async def get_user_subscription_history(user_id: str, admin_id: str = Depends(is_admin)):
    """Get subscription purchase history for a user"""
    history = await subscription_history_collection.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("purchase_date", -1).to_list(100)
    
    return history

@router.get("/subscription/active-users")
async def get_active_subscription_users(admin_id: str = Depends(is_admin)):
    """Get all users with active subscriptions"""
    now = datetime.now(timezone.utc).isoformat()
    users = await users_collection.find(
        {
            "active_subscription": {"$ne": None},
            "subscription_expires_at": {"$gt": now}
        },
        {"_id": 0}
    ).to_list(1000)
    
    result = []
    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
        if isinstance(user.get("subscription_activated_at"), str):
            user["subscription_activated_at"] = datetime.fromisoformat(user["subscription_activated_at"])
        if isinstance(user.get("subscription_expires_at"), str):
            user["subscription_expires_at"] = datetime.fromisoformat(user["subscription_expires_at"])
        result.append(User(**user))
    
    return result

@router.put("/subscription/toggle")
async def toggle_subscription_plan(plan_name: str, enabled: bool, admin_id: str = Depends(is_admin)):
    """Toggle a subscription plan on or off"""
    await subscriptions_settings_collection.update_one(
        {"plan_name": plan_name},
        {"$set": {"enabled": enabled, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": f"Plan {plan_name} {'enabled' if enabled else 'disabled'}"}

@router.get("/feedbacks")
async def get_all_feedbacks(admin_id: str = Depends(is_admin)):
    """Get all user feedbacks"""
    feedbacks = await feedback_collection.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return feedbacks
