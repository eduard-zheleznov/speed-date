from fastapi import APIRouter, HTTPException, Depends
from models import MatchInfo, Message, MessageCreate, UserPublic
from auth import get_current_user_id
from database import matches_collection, messages_collection, users_collection
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])

class LastMessage(BaseModel):
    text: str
    timestamp: datetime
    is_own: bool

class MatchInfoExtended(BaseModel):
    id: str
    partner: UserPublic
    matched_at: datetime
    expires_in_days: int
    active: bool
    unread_count: int = 0
    last_message: Optional[LastMessage] = None

@router.get("/matches")
async def get_matches(user_id: str = Depends(get_current_user_id)):
    matches = await matches_collection.find(
        {
            "$or": [{"user1_id": user_id}, {"user2_id": user_id}],
            "active": True
        },
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for match in matches:
        partner_id = match["user2_id"] if match["user1_id"] == user_id else match["user1_id"]
        partner_dict = await users_collection.find_one({"id": partner_id}, {"_id": 0})
        
        if partner_dict:
            if isinstance(match["matched_at"], str):
                match["matched_at"] = datetime.fromisoformat(match["matched_at"])
            if isinstance(match["chat_expires_at"], str):
                match["chat_expires_at"] = datetime.fromisoformat(match["chat_expires_at"])
            
            days_remaining = (match["chat_expires_at"] - datetime.now(timezone.utc)).days
            
            # Get unread count
            last_read_key = f"last_read_{user_id}"
            last_read = match.get(last_read_key)
            
            unread_query = {"match_id": match["id"], "sender_id": {"$ne": user_id}}
            if last_read:
                unread_query["timestamp"] = {"$gt": last_read}
            
            unread_count = await messages_collection.count_documents(unread_query)
            
            # Get last message
            last_msg = await messages_collection.find_one(
                {"match_id": match["id"]},
                {"_id": 0},
                sort=[("timestamp", -1)]
            )
            
            last_message = None
            if last_msg:
                if isinstance(last_msg.get("timestamp"), str):
                    last_msg["timestamp"] = datetime.fromisoformat(last_msg["timestamp"])
                last_message = LastMessage(
                    text=last_msg["text"][:50] + ("..." if len(last_msg["text"]) > 50 else ""),
                    timestamp=last_msg["timestamp"],
                    is_own=last_msg["sender_id"] == user_id
                )
            
            match_info = {
                "id": match["id"],
                "partner": UserPublic(**partner_dict).model_dump(),
                "matched_at": match["matched_at"].isoformat(),
                "expires_in_days": max(0, days_remaining),
                "active": match["active"],
                "unread_count": unread_count,
                "last_message": last_message.model_dump() if last_message else None
            }
            result.append(match_info)
    
    # Sort by last message time (most recent first)
    def get_sort_key(x):
        if x.get("last_message") and x["last_message"].get("timestamp"):
            ts = x["last_message"]["timestamp"]
            if isinstance(ts, str):
                return ts
            return ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
        return ""
    
    result.sort(key=get_sort_key, reverse=True)
    
    return result

@router.get("/{match_id}/messages", response_model=List[Message])
async def get_messages(match_id: str, user_id: str = Depends(get_current_user_id)):
    # Verify user is part of match
    match = await matches_collection.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match["user1_id"] != user_id and match["user2_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await messages_collection.find({"match_id": match_id}, {"_id": 0}).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get("timestamp"), str):
            msg["timestamp"] = datetime.fromisoformat(msg["timestamp"])
    
    # Mark messages as read
    await matches_collection.update_one(
        {"id": match_id},
        {"$set": {f"last_read_{user_id}": datetime.now(timezone.utc).isoformat()}}
    )
    
    return [Message(**msg) for msg in messages]

@router.post("/{match_id}/message", response_model=Message)
async def send_message(match_id: str, message_data: MessageCreate, user_id: str = Depends(get_current_user_id)):
    # Verify user is part of match
    match = await matches_collection.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match["user1_id"] != user_id and match["user2_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not match.get("active", False):
        raise HTTPException(status_code=400, detail="Chat is no longer active")
    
    # Check if chat expired
    if isinstance(match["chat_expires_at"], str):
        match["chat_expires_at"] = datetime.fromisoformat(match["chat_expires_at"])
    
    if datetime.now(timezone.utc) > match["chat_expires_at"]:
        await matches_collection.update_one({"id": match_id}, {"$set": {"active": False}})
        raise HTTPException(status_code=400, detail="Chat has expired")
    
    message = Message(
        match_id=match_id,
        sender_id=user_id,
        text=message_data.text
    )
    
    message_dict = message.model_dump()
    message_dict["timestamp"] = message_dict["timestamp"].isoformat()
    
    await messages_collection.insert_one(message_dict)
    
    return message

@router.get("/{match_id}/info")
async def get_match_info(match_id: str, user_id: str = Depends(get_current_user_id)):
    match = await matches_collection.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match["user1_id"] != user_id and match["user2_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    partner_id = match["user2_id"] if match["user1_id"] == user_id else match["user1_id"]
    partner_dict = await users_collection.find_one({"id": partner_id}, {"_id": 0})
    
    if not partner_dict:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    if isinstance(match["matched_at"], str):
        match["matched_at"] = datetime.fromisoformat(match["matched_at"])
    if isinstance(match["chat_expires_at"], str):
        match["chat_expires_at"] = datetime.fromisoformat(match["chat_expires_at"])
    
    days_remaining = (match["chat_expires_at"] - datetime.now(timezone.utc)).days
    
    return {
        "id": match["id"],
        "partner": UserPublic(**partner_dict).model_dump(),
        "matched_at": match["matched_at"].isoformat(),
        "expires_in_days": max(0, days_remaining),
        "active": match["active"]
    }
