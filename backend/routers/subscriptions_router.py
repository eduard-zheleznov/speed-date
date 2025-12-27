from fastapi import APIRouter, Depends, HTTPException
from models import SubscriptionPlan, CommunicationsStatus
from auth import get_current_user_id
from database import daily_communications_collection, subscriptions_settings_collection, users_collection, subscription_history_collection
from datetime import datetime, timezone, timedelta
from typing import List
import uuid

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

SUBSCRIPTION_PLANS = [
    SubscriptionPlan(name="Серебро", price=490, communications=5, enabled=True),
    SubscriptionPlan(name="Золото", price=990, communications=10, enabled=True),
    SubscriptionPlan(name="VIP", price=1900, communications=20, enabled=True)
]

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    # Get settings from DB
    plans_with_settings = []
    for plan in SUBSCRIPTION_PLANS:
        setting = await subscriptions_settings_collection.find_one({"plan_name": plan.name}, {"_id": 0})
        if setting:
            plan_dict = plan.model_dump()
            plan_dict["enabled"] = setting.get("enabled", True)
            plans_with_settings.append(SubscriptionPlan(**plan_dict))
        else:
            plans_with_settings.append(plan)
    
    return plans_with_settings

@router.get("/my-status", response_model=CommunicationsStatus)
async def get_my_subscription_status(user_id: str = Depends(get_current_user_id)):
    """
    Get user's daily communications status.
    Logic:
    - Every user gets 5 FREE communications per day by default
    - After midnight (00:00), the counter resets to 5 free + premium (if subscribed)
    - Premium users get additional communications based on their plan
    """
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    
    # Check if user has active subscription
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    active_plan = None
    premium_count = 0
    
    if user:
        expires_at = user.get("subscription_expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expires_at > now:
                active_plan = user.get("active_subscription")
                # Get premium communications for active plan
                plan = next((p for p in SUBSCRIPTION_PLANS if p.name == active_plan), None)
                if plan:
                    premium_count = plan.communications
    
    # Get or create daily communications record
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        # New day - create fresh record with reset values
        # FREE: 5 communications per day (always)
        # PREMIUM: additional communications based on subscription
        comm_status = {
            "user_id": user_id, 
            "date": today, 
            "free_count": 5,  # Always 5 free per day
            "premium_count": premium_count,  # Additional from subscription
            "used_count": 0  # Reset to 0 at start of new day
        }
        await daily_communications_collection.insert_one(comm_status)
    else:
        # Existing record for today - check if premium needs updating
        if active_plan and comm_status.get("premium_count", 0) < premium_count:
            comm_status["premium_count"] = premium_count
            await daily_communications_collection.update_one(
                {"user_id": user_id, "date": today},
                {"$set": {"premium_count": premium_count}}
            )
    
    # Calculate remaining communications
    used = comm_status.get("used_count", 0)
    free_available = comm_status.get("free_count", 5)
    premium_available = comm_status.get("premium_count", 0)
    
    # Free communications are used first
    remaining_free = max(0, free_available - used)
    # Premium is used only after free is exhausted
    remaining_premium = premium_available if used < free_available else max(0, premium_available - (used - free_available))
    
    total_available = remaining_free + remaining_premium
    
    # Calculate reset time (next midnight UTC)
    tomorrow = now.date() + timedelta(days=1)
    reset_time = datetime.combine(tomorrow, datetime.min.time()).replace(tzinfo=timezone.utc)
    resets_at = reset_time.isoformat()
    
    return CommunicationsStatus(
        remaining_free=remaining_free,
        premium_available=remaining_premium,
        total_available=total_available,
        resets_at=resets_at
    )

@router.post("/purchase")
async def purchase_subscription(plan_name: str, user_id: str = Depends(get_current_user_id)):
    # Find plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p.name == plan_name), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if plan is enabled
    setting = await subscriptions_settings_collection.find_one({"plan_name": plan_name}, {"_id": 0})
    if setting and not setting.get("enabled", True):
        raise HTTPException(status_code=400, detail="Тариф временно не доступен")
    
    # TODO: Integrate with ЮKassa payment
    # For now, just activate subscription
    
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
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "plan_name": plan_name,
        "price": plan.price,
        "communications_per_day": plan.communications,
        "purchase_date": now.isoformat(),
        "activated_by": "user"
    }
    await subscription_history_collection.insert_one(history_entry)
    
    # Set daily communications
    today = now.date().isoformat()
    await daily_communications_collection.update_one(
        {"user_id": user_id, "date": today},
        {"$set": {"premium_count": plan.communications, "free_count": 5, "used_count": 0}},
        upsert=True
    )
    
    return {"message": f"Подписка {plan_name} успешно оформлена на 1 месяц", "communications_per_day": plan.communications}
