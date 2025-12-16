from fastapi import APIRouter, Depends, HTTPException
from models import SubscriptionPlan, CommunicationsStatus
from auth import get_current_user_id
from database import daily_communications_collection
from datetime import datetime, timezone, timedelta
from typing import List

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

SUBSCRIPTION_PLANS = [
    SubscriptionPlan(name="Серебро", price=490, communications=5, enabled=True),
    SubscriptionPlan(name="Золото", price=990, communications=10, enabled=True),
    SubscriptionPlan(name="VIP", price=1900, communications=20, enabled=True)
]

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@router.get("/my-status", response_model=CommunicationsStatus)
async def get_my_subscription_status(user_id: str = Depends(get_current_user_id)):
    today = datetime.now(timezone.utc).date().isoformat()
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        comm_status = {"user_id": user_id, "date": today, "free_count": 5, "premium_count": 0, "used_count": 0}
        await daily_communications_collection.insert_one(comm_status)
    
    remaining_free = max(0, comm_status["free_count"] - comm_status["used_count"])
    premium_available = comm_status["premium_count"]
    total_available = remaining_free + premium_available
    
    # Calculate when it resets (midnight UTC)
    tomorrow = datetime.now(timezone.utc).date()
    tomorrow = datetime.combine(tomorrow, datetime.min.time()).replace(tzinfo=timezone.utc)
    resets_at = (tomorrow.replace(hour=0, minute=0, second=0, microsecond=0) + timezone.timedelta(days=1)).isoformat()
    
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
    
    # TODO: Integrate with ЮKassa payment
    # For now, just add communications
    
    today = datetime.now(timezone.utc).date().isoformat()
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        comm_status = {"user_id": user_id, "date": today, "free_count": 5, "premium_count": 0, "used_count": 0}
        await daily_communications_collection.insert_one(comm_status)
    
    # Add premium communications
    await daily_communications_collection.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {"premium_count": plan.communications}}
    )
    
    return {"message": f"Successfully purchased {plan_name} plan (mock)", "communications_added": plan.communications}
