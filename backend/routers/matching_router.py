from fastapi import APIRouter, HTTPException, Depends
from models import VideoSession, MatchDecision, Match, UserPublic
from auth import get_current_user_id
from database import (
    users_collection, filters_collection, video_sessions_collection,
    matches_collection, daily_communications_collection
)
from datetime import datetime, timedelta, timezone
import random

router = APIRouter(prefix="/matching", tags=["matching"])

@router.post("/find-match", response_model=UserPublic)
async def find_match(user_id: str = Depends(get_current_user_id)):
    # Get user's filters
    user_filters = await filters_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not user_filters:
        raise HTTPException(status_code=400, detail="Please set your filters first")
    
    # Get user info
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user.get("profile_completed"):
        raise HTTPException(status_code=400, detail="Please complete your profile first")
    
    # Check daily communications
    today = datetime.now(timezone.utc).date().isoformat()
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        comm_status = {"user_id": user_id, "date": today, "free_count": 5, "premium_count": 0, "used_count": 0}
        await daily_communications_collection.insert_one(comm_status)
    
    total_available = comm_status["free_count"] + comm_status["premium_count"] - comm_status["used_count"]
    if total_available <= 0:
        raise HTTPException(status_code=403, detail="No communications remaining for today")
    
    # Parse age range
    age_range = user_filters["age_range"]
    if age_range == "18-25":
        min_age, max_age = 18, 25
    elif age_range == "25-35":
        min_age, max_age = 25, 35
    elif age_range == "35-45":
        min_age, max_age = 35, 45
    elif age_range == "45-55":
        min_age, max_age = 45, 55
    else:  # "55+"
        min_age, max_age = 55, 120
    
    # Build query for potential matches
    match_query = {
        "id": {"$ne": user_id},
        "profile_completed": True,
        "blocked": False,
        "gender": user_filters["gender_preference"],
        "city": user_filters["city"],
        "age": {"$gte": min_age, "$lte": max_age}
    }
    
    if user_filters["smoking_preference"] != "any":
        match_query["smoking"] = user_filters["smoking_preference"]
    
    # Find potential matches
    potential_matches = await users_collection.find(match_query, {"_id": 0}).to_list(100)
    
    if not potential_matches:
        raise HTTPException(status_code=404, detail="No matches found. Please change your filters.")
    
    # Filter by mutual criteria
    valid_matches = []
    for match_user in potential_matches:
        match_filters = await filters_collection.find_one({"user_id": match_user["id"]}, {"_id": 0})
        if not match_filters:
            continue
        
        # Check if current user matches the other user's filters
        if match_filters["gender_preference"] != user.get("gender"):
            continue
        
        if match_filters["city"] != user.get("city"):
            continue
        
        # Check age range
        match_age_range = match_filters["age_range"]
        user_age = user.get("age", 0)
        if match_age_range == "18-25" and not (18 <= user_age <= 25):
            continue
        elif match_age_range == "25-35" and not (25 <= user_age <= 35):
            continue
        elif match_age_range == "35-45" and not (35 <= user_age <= 45):
            continue
        elif match_age_range == "45-55" and not (45 <= user_age <= 55):
            continue
        elif match_age_range == "55+" and user_age < 55:
            continue
        
        valid_matches.append(match_user)
    
    if not valid_matches:
        raise HTTPException(status_code=404, detail="No mutual matches found. Please change your filters.")
    
    # Select random match
    selected_match = random.choice(valid_matches)
    
    return UserPublic(**selected_match)

@router.post("/video-session", response_model=VideoSession)
async def start_video_session(match_user_id: str, user_id: str = Depends(get_current_user_id)):
    # Check communications
    today = datetime.now(timezone.utc).date().isoformat()
    comm_status = await daily_communications_collection.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not comm_status:
        comm_status = {"user_id": user_id, "date": today, "free_count": 5, "premium_count": 0, "used_count": 0}
        await daily_communications_collection.insert_one(comm_status)
    
    total_available = comm_status["free_count"] + comm_status["premium_count"] - comm_status["used_count"]
    if total_available <= 0:
        raise HTTPException(status_code=403, detail="No communications remaining")
    
    # Create video session
    session = VideoSession(
        user1_id=user_id,
        user2_id=match_user_id
    )
    
    session_dict = session.model_dump()
    session_dict["started_at"] = session_dict["started_at"].isoformat()
    
    await video_sessions_collection.insert_one(session_dict)
    
    # Increment used count
    await daily_communications_collection.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {"used_count": 1}}
    )
    
    return session

@router.put("/video-session/{session_id}/end")
async def end_video_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    session_dict = await video_sessions_collection.find_one({"id": session_id}, {"_id": 0})
    if not session_dict:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_dict["user1_id"] != user_id and session_dict["user2_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ended_at = datetime.now(timezone.utc)
    started_at = datetime.fromisoformat(session_dict["started_at"])
    duration = int((ended_at - started_at).total_seconds())
    
    await video_sessions_collection.update_one(
        {"id": session_id},
        {"$set": {"ended_at": ended_at.isoformat(), "duration": duration, "status": "ended"}}
    )
    
    return {"message": "Session ended", "duration": duration}

@router.post("/decision")
async def make_decision(decision: MatchDecision, user_id: str = Depends(get_current_user_id)):
    session_dict = await video_sessions_collection.find_one({"id": decision.session_id}, {"_id": 0})
    if not session_dict:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_dict["user1_id"] != user_id and session_dict["user2_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store decision
    decision_field = f"user1_decision" if session_dict["user1_id"] == user_id else "user2_decision"
    await video_sessions_collection.update_one(
        {"id": decision.session_id},
        {"$set": {decision_field: decision.accepted}}
    )
    
    # Check if both decided
    updated_session = await video_sessions_collection.find_one({"id": decision.session_id}, {"_id": 0})
    user1_decision = updated_session.get("user1_decision")
    user2_decision = updated_session.get("user2_decision")
    
    if user1_decision is not None and user2_decision is not None:
        if user1_decision and user2_decision:
            # Both said YES - create match
            match = Match(
                user1_id=session_dict["user1_id"],
                user2_id=session_dict["user2_id"],
                chat_expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            
            match_dict = match.model_dump()
            match_dict["matched_at"] = match_dict["matched_at"].isoformat()
            match_dict["chat_expires_at"] = match_dict["chat_expires_at"].isoformat()
            
            await matches_collection.insert_one(match_dict)
            
            return {"matched": True, "match_id": match.id}
        else:
            return {"matched": False}
    
    return {"message": "Waiting for other user's decision"}
