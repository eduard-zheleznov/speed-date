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
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if user has active subscription
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    active_plan = None
    if user:
        expires_at = user.get("subscription_expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expires_at > datetime.now(timezone.utc):
                active_plan = user.get("active_subscription")
    
    # Get or create daily communications
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        # Determine premium count based on active subscription
        premium_count = 0
        if active_plan:
            plan = next((p for p in SUBSCRIPTION_PLANS if p.name == active_plan), None)
            if plan:
                premium_count = plan.communications
        
        comm_status = {"user_id": user_id, "date": today, "free_count": 5, "premium_count": premium_count, "used_count": 0}
        await daily_communications_collection.insert_one(comm_status)
    else:
        # Update premium count if user has active subscription but daily record doesn't reflect it
        if active_plan:
            plan = next((p for p in SUBSCRIPTION_PLANS if p.name == active_plan), None)
            if plan and comm_status.get("premium_count", 0) < plan.communications:
                comm_status["premium_count"] = plan.communications
                await daily_communications_collection.update_one(
                    {"user_id": user_id, "date": today},
                    {"$set": {"premium_count": plan.communications}}
                )
    
    remaining_free = max(0, comm_status["free_count"] - comm_status["used_count"])
    premium_available = comm_status.get("premium_count", 0)
    total_available = remaining_free + premium_available
    
    # Calculate when it resets (midnight UTC)
    tomorrow = datetime.now(timezone.utc).date()
    tomorrow = datetime.combine(tomorrow, datetime.min.time()).replace(tzinfo=timezone.utc)
    resets_at = (tomorrow.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat()
    
    return CommunicationsStatus(
        remaining_free=remaining_free,
        premium_available=premium_available,
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
