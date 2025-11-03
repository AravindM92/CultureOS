from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.moment_service import MomentService
from app.models.schemas import MomentResponse, MomentCreate, MomentUpdate
from datetime import date

router = APIRouter(prefix="/moments", tags=["moments"])
moment_service = MomentService()


@router.get("/", response_model=List[MomentResponse])
async def get_moments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """Get all moments with pagination"""
    return await moment_service.get_all(skip, limit)


@router.post("/", response_model=MomentResponse)
async def create_moment(moment: MomentCreate):
    """
    Create a new moment (admin only)
    
    CRITICAL REQUIREMENT: The person_name MUST exist in the users table.
    Moments can only be created for team members who are already in the database.
    
    If the celebrant is not in the users table, you must:
    1. First add them to the users table via POST /users/
    2. Then create the moment
    
    This ensures data integrity and proper relationships between users, moments, and greetings.
    """
    result = await moment_service.create_moment(moment)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create moment")
    return result


@router.get("/{moment_id}", response_model=MomentResponse)
async def get_moment(moment_id: int):
    """Get a specific moment by ID"""
    moment = await moment_service.get_by_id(moment_id)
    if not moment:
        raise HTTPException(status_code=404, detail="Moment not found")
    return moment


@router.put("/{moment_id}", response_model=MomentResponse)
async def update_moment(moment_id: int, moment_update: MomentUpdate):
    """Update a moment"""
    result = await moment_service.update_moment(moment_id, moment_update)
    if not result:
        raise HTTPException(status_code=404, detail="Moment not found")
    return result


@router.get("/user/{user_id}", response_model=List[MomentResponse])
async def get_moments_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all moments for a specific user"""
    return await moment_service.get_by_user_id(user_id, skip, limit)


@router.get("/type/{moment_type}", response_model=List[MomentResponse])
async def get_moments_by_type(
    moment_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get moments by type (birthday, work_anniversary, lwd, etc.)"""
    return await moment_service.get_by_type(moment_type, skip, limit)


@router.get("/status/{status}", response_model=List[MomentResponse])
async def get_moments_by_status(
    status: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get moments by status (active, completed, cancelled)"""
    return await moment_service.get_by_status(status, skip, limit)


@router.get("/upcoming/{days}", response_model=List[MomentResponse])
async def get_upcoming_moments(days: int = 7):
    """Get upcoming moments in the next N days"""
    return await moment_service.get_upcoming(days)


@router.post("/{moment_id}/notify")
async def mark_moment_notified(moment_id: int):
    """Mark moment as notified (team has been informed)"""
    result = await moment_service.mark_as_notified(moment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Moment not found")
    return {"message": "Moment marked as notified", "moment": result}


@router.post("/{moment_id}/complete")
async def mark_moment_completed(moment_id: int):
    """Mark moment as completed (greeting card sent)"""
    result = await moment_service.mark_as_completed(moment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Moment not found")
    return {"message": "Moment marked as completed", "moment": result}


@router.get("/category/{category}", response_model=List[MomentResponse])
async def get_moments_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get moments by category (welcome, celebration, farewell)"""
    if category not in ['welcome', 'celebration', 'farewell']:
        raise HTTPException(status_code=400, detail="Invalid category. Must be: welcome, celebration, or farewell")
    return await moment_service.get_by_category(category, skip, limit)


@router.get("/notifications/{target_date}", response_model=List[MomentResponse])
async def get_moments_for_notification(target_date: date):
    """Get moments that need notification on target date"""
    return await moment_service.get_moments_for_notification(target_date)