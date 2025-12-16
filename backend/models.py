from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    age_confirmed: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    smoking: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    age: Optional[int] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    smoking: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    photos: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    blocked: bool = False
    complaint_count: int = 0
    profile_completed: bool = False

class UserPublic(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    smoking: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    photos: List[str] = []

# Filter Models
class FiltersUpdate(BaseModel):
    age_range: str
    gender_preference: str
    city: str
    smoking_preference: str

class Filters(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    age_range: str
    gender_preference: str
    city: str
    smoking_preference: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Video Session Models
class VideoSessionStart(BaseModel):
    match_user_id: str

class VideoSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user1_id: str
    user2_id: str
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = None
    duration: int = 0
    status: str = "active"

# Match Models
class MatchDecision(BaseModel):
    session_id: str
    accepted: bool

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user1_id: str
    user2_id: str
    matched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    chat_expires_at: datetime
    active: bool = True

class MatchInfo(BaseModel):
    id: str
    partner: UserPublic
    matched_at: datetime
    expires_in_days: int
    active: bool

# Message Models
class MessageCreate(BaseModel):
    text: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    sender_id: str
    text: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Complaint Models
class ComplaintCreate(BaseModel):
    reported_user_id: str
    reason: Optional[str] = None

class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    complainant_id: str
    reported_user_id: str
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subscription Models
class SubscriptionPlan(BaseModel):
    name: str
    price: int
    communications: int
    enabled: bool = True

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_name: str
    purchase_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    communications_added: int
    active: bool = True

# Daily Communications Models
class DailyCommunications(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    date: str
    free_count: int = 5
    premium_count: int = 0
    used_count: int = 0

class CommunicationsStatus(BaseModel):
    remaining_free: int
    premium_available: int
    total_available: int
    resets_at: str

# Auth Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
