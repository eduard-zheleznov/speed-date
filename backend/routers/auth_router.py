from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, TokenResponse, User, PasswordChange, PasswordReset
from auth import get_password_hash, verify_password, create_access_token, get_current_user_id
from database import users_collection
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    if not user_data.age_confirmed:
        raise HTTPException(status_code=400, detail="You must confirm you are 18+ years old")
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await users_collection.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_dict = await users_collection.find_one({"email": credentials.email}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_dict["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if user_dict.get("blocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked")
    
    # Update last login
    await users_collection.update_one(
        {"id": user_dict["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Parse dates
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    user = User(**user_dict)
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@router.post("/forgot-password")
async def forgot_password(data: PasswordReset):
    user = await users_collection.find_one({"email": data.email}, {"_id": 0})
    if not user:
        return {"message": "If the email exists, a reset link will be sent"}
    
    # TODO: Send email with reset token
    # For now, just return success
    return {"message": "Password reset email sent (mock)"}

@router.post("/change-password")
async def change_password(data: PasswordChange, user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(data.current_password, user_dict["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = get_password_hash(data.new_password)
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=User)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)
