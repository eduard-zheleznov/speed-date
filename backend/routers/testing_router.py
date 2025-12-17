from fastapi import APIRouter, HTTPException, Depends
from models import VideoSession, Match
from auth import get_current_user_id
from database import users_collection, video_sessions_collection, matches_collection
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter(prefix="/testing", tags=["testing"])

@router.post("/create-demo-match")
async def create_demo_match(user_id: str = Depends(get_current_user_id)):
    """Create a demo match for testing chat functionality"""
    
    # Find a test user to match with
    test_user = await users_collection.find_one(
        {"id": {"$ne": user_id}, "profile_completed": True},
        {"_id": 0}
    )
    
    if not test_user:
        raise HTTPException(status_code=404, detail="No test user found")
    
    # Create a completed video session
    session = VideoSession(
        user1_id=user_id,
        user2_id=test_user["id"],
        ended_at=datetime.now(timezone.utc),
        duration=600,
        status="ended"
    )
    
    session_dict = session.model_dump()
    session_dict["started_at"] = session_dict["started_at"].isoformat()
    session_dict["ended_at"] = session_dict["ended_at"].isoformat()
    session_dict["user1_decision"] = True
    session_dict["user2_decision"] = True
    
    await video_sessions_collection.insert_one(session_dict)
    
    # Create match
    match = Match(
        user1_id=user_id,
        user2_id=test_user["id"],
        chat_expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    
    match_dict = match.model_dump()
    match_dict["matched_at"] = match_dict["matched_at"].isoformat()
    match_dict["chat_expires_at"] = match_dict["chat_expires_at"].isoformat()
    
    await matches_collection.insert_one(match_dict)
    
    return {
        "message": "Demo match created",
        "match_id": match.id,
        "partner_name": test_user["name"],
        "session_id": session.id
    }
