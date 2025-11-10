"""
WFO Database Models and Schema
=============================
SQLAlchemy models for WFO Prediction tables in existing thunai_culture.db
These are NEW tables that don't interfere with existing schema.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class WFOStatusEnum(enum.Enum):
    office = "office"
    home = "home" 
    hybrid = "hybrid"
    leave = "leave"
    
class CollectionMethodEnum(enum.Enum):
    weekly = "weekly"
    daily = "daily"
    
class AttemptTypeEnum(enum.Enum):
    weekly_friday = "weekly_friday"
    weekly_monday = "weekly_monday_followup"
    daily = "daily"
    
class MessageTypeEnum(enum.Enum):
    weekly_friday = "weekly_friday"
    weekly_monday_followup = "weekly_monday_followup"
    daily_evening = "daily_evening"
    
class MessageStatusEnum(enum.Enum):
    pending = "pending"
    sent = "sent" 
    completed = "completed"
    cancelled = "cancelled"

class WFOAvailability(Base):
    """
    WFO Availability Data - Core table for user office plans
    """
    __tablename__ = "wfo_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    week_start_date = Column(Date, nullable=False, index=True)
    
    # Daily status for the week
    monday_status = Column(Enum(WFOStatusEnum), nullable=True)
    tuesday_status = Column(Enum(WFOStatusEnum), nullable=True)
    wednesday_status = Column(Enum(WFOStatusEnum), nullable=True)
    thursday_status = Column(Enum(WFOStatusEnum), nullable=True)
    friday_status = Column(Enum(WFOStatusEnum), nullable=True)
    
    # Calculated fields
    office_days_count = Column(Integer, default=0)
    is_compliant = Column(Boolean, default=False)  # meets 3-day minimum
    
    # Collection metadata
    collection_method = Column(Enum(CollectionMethodEnum), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    class Config:
        arbitrary_types_allowed = True

class WFOCollectionAttempts(Base):
    """
    WFO Collection History - Track all attempts for smart stopping logic
    """
    __tablename__ = "wfo_collection_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    week_start_date = Column(Date, nullable=False, index=True)
    
    # Attempt details
    attempt_type = Column(Enum(AttemptTypeEnum), nullable=False)
    attempt_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Response details
    response_received = Column(Boolean, default=False)
    response_data = Column(Text, nullable=True)  # LLM extracted data
    success = Column(Boolean, default=False)
    
    # Logging
    reason = Column(String(500), nullable=True)
    
class WFOScheduledMessages(Base):
    """
    Proactive Message Scheduling - Track scheduled WFO collection messages
    """
    __tablename__ = "wfo_scheduled_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    
    # Message details
    message_type = Column(Enum(MessageTypeEnum), nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=False)
    week_target = Column(Date, nullable=False)  # which week we're collecting for
    
    # Status
    status = Column(Enum(MessageStatusEnum), default=MessageStatusEnum.pending)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)