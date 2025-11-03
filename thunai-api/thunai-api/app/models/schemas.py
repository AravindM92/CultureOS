from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


class UserCreate(BaseModel):
    teams_user_id: str
    name: str
    email: EmailStr
    is_admin: Optional[bool] = False


class UserUpdate(BaseModel):
    teams_user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    teams_user_id: str
    name: str
    email: EmailStr
    is_admin: bool
    created_at: str
    updated_at: str

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
    person_name: str  # Must match a user.name from users table
    moment_type: str  # 'birthday', 'work_anniversary', 'lwd', 'promotion', 'new_hire', 'achievement', 'other'
    moment_date: date
    description: Optional[str] = None
    created_by: str  # Teams user ID of admin who created it


class MomentUpdate(BaseModel):
    person_name: Optional[str] = None
    moment_type: Optional[str] = None
    moment_date: Optional[date] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    notification_sent: Optional[bool] = None


class MomentResponse(BaseModel):
    id: int
    person_name: str
    moment_type: str
    moment_date: date
    description: Optional[str]
    created_by: str
    created_at: str
    updated_at: str
    is_active: bool
    notification_sent: bool
    tags: Optional[str] = None

    class Config:
        from_attributes = True


class GreetingCreate(BaseModel):
    moment_id: int
    user_id: str  # teams_user_id from users table
    greeting_text: str
    moment_type: str  # For backward compatibility


class GreetingResponse(BaseModel):
    id: int
    moment_id: Optional[int]
    user_id: Optional[str]  # teams_user_id
    greeting_text: str
    moment_type: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True