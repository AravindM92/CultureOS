from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    date_of_birth: date
    date_of_joining: date
    last_working_date: Optional[date] = None
    job_level: str
    roleid: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    date_of_joining: Optional[date] = None
    last_working_date: Optional[date] = None
    job_level: Optional[str] = None
    roleid: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    date_of_birth: date
    date_of_joining: date
    last_working_date: Optional[date]
    job_level: str
    roleid: int

    class Config:
        from_attributes = True


class AccoladeResponse(BaseModel):
    id: int
    user_id: int
    achieved_date: date
    accolade_type: str
    info_desc: str

    class Config:
        from_attributes = True


class GossipResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    gossip_type: str

    class Config:
        from_attributes = True


class QuestResponse(BaseModel):
    id: int
    question: str
    answer: Optional[str]
    quest_type: str

    class Config:
        from_attributes = True


class ThoughtResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    thought_type: str

    class Config:
        from_attributes = True


class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100

    class Config:
        from_attributes = True


# =====================================================
# MOMENTS MODULE SCHEMAS
# =====================================================

class MomentCreate(BaseModel):
    user_id: int
    celebration_date: date
    moment_type: str  # 'birthday', 'work_anniversary', 'lwd', etc.
    moment_category: str  # 'welcome', 'celebration', 'farewell'
    title: str
    description: Optional[str] = None
    created_by: int  # Admin user ID
    celebrant_user_id: Optional[int] = None  # Who is being celebrated
    notification_days: Optional[int] = 1  # Days before to notify team


class MomentUpdate(BaseModel):
    user_id: Optional[int] = None
    celebration_date: Optional[date] = None
    moment_type: Optional[str] = None
    moment_category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # 'active', 'completed', 'cancelled'
    celebrant_user_id: Optional[int] = None
    notification_days: Optional[int] = None


class MomentResponse(BaseModel):
    id: int
    user_id: int
    celebration_date: date
    moment_type: str
    moment_category: Optional[str]
    title: str
    description: Optional[str]
    status: str
    created_by: int
    celebrant_user_id: Optional[int]
    notification_days: Optional[int]
    created_at: str
    notified_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True


class GreetingCreate(BaseModel):
    moment_id: int
    user_id: int
    greeting_text: str


class GreetingResponse(BaseModel):
    id: int
    moment_id: int
    user_id: int
    greeting_text: str
    created_at: str

    class Config:
        from_attributes = True