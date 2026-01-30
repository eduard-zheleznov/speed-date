from fastapi import APIRouter, HTTPException, Depends
from models import VideoSession, Match
from auth import get_current_user_id
from database import users_collection, video_sessions_collection, matches_collection, get_db
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter(prefix="/testing", tags=["testing"])

@router.post("/init-database")
async def init_database():
    """Initialize database with super admin - call this after fresh deploy"""
    from seed_data import create_super_admin
    
    try:
        db = await get_db()
        await create_super_admin(db)
        return {"message": "Database initialized successfully", "admin_email": "admin@test.com"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-demo-match")
async def create_demo_match(user_id: str = Depends(get_current_user_id)):
    """Create a demo match for testing chat functionality"""
    
    # Find a test user to match with (any user except current one)
    test_user = await users_collection.find_one(
        {"id": {"$ne": user_id}},
        {"_id": 0}
    )
    
    if not test_user:
        # Create a demo user if none exists
        demo_user = {
            "id": f"demo-user-{str(uuid.uuid4())[:8]}",
            "email": f"demo_{datetime.now().timestamp()}@test.com",
            "name": f"Test User {int(datetime.now().timestamp()) % 1000000}",
            "age": 25,
            "gender": "female",
            "city": "Москва",
            "height": 165,
            "weight": 55,
            "education": "higher",
            "smoking": "negative",
            "photos": [],
            "profile_completed": True,
            "blocked": False,
            "complaint_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "hashed_password": "demo"
        }
        await users_collection.insert_one(demo_user)
        test_user = demo_user
    
    # Check if match already exists
    existing_match = await matches_collection.find_one({
        "$or": [
            {"user1_id": user_id, "user2_id": test_user["id"]},
            {"user1_id": test_user["id"], "user2_id": user_id}
        ],
        "active": True
    })
    
    if existing_match:
        return {
            "message": "Match already exists",
            "match_id": existing_match["id"],
            "partner_name": test_user["name"]
        }
    
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
