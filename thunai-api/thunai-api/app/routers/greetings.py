from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.greeting_service import GreetingService
from app.models.schemas import GreetingResponse, GreetingCreate

router = APIRouter(prefix="/greetings", tags=["greetings"])
greeting_service = GreetingService()


@router.get("/", response_model=List[GreetingResponse])
async def get_greetings(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """Get all greetings with pagination"""
    return await greeting_service.get_all(skip, limit)


@router.post("/", response_model=GreetingResponse)
async def create_greeting(greeting: GreetingCreate):
    """Create a new greeting for a moment"""
    try:
        result = await greeting_service.create_greeting(greeting)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create greeting")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{greeting_id}", response_model=GreetingResponse)
async def get_greeting(greeting_id: int):
    """Get a specific greeting by ID"""
    greeting = await greeting_service.get_by_id(greeting_id)
    if not greeting:
        raise HTTPException(status_code=404, detail="Greeting not found")
    return greeting


@router.get("/moment/{moment_id}", response_model=List[GreetingResponse])
async def get_greetings_for_moment(
    moment_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all greetings for a specific moment"""
    return await greeting_service.get_by_moment_id(moment_id, skip, limit)


@router.get("/user/{user_id}", response_model=List[GreetingResponse])
async def get_greetings_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all greetings sent by a specific user"""
    return await greeting_service.get_by_user_id(user_id, skip, limit)


@router.get("/moment/{moment_id}/count")
async def get_greeting_count_for_moment(moment_id: int):
    """Get the total number of greetings for a moment"""
    count = await greeting_service.get_greeting_count(moment_id)
    return {"moment_id": moment_id, "greeting_count": count}