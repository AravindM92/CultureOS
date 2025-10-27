from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.thought_service import ThoughtService
from app.models.schemas import ThoughtResponse

router = APIRouter(prefix="/thoughts", tags=["thoughts"])
thought_service = ThoughtService()


@router.get("/", response_model=List[ThoughtResponse])
async def get_thoughts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    return await thought_service.get_all(skip, limit)


@router.get("/{thought_id}", response_model=ThoughtResponse)
async def get_thought(thought_id: int):
    thought = await thought_service.get_by_id(thought_id)
    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")
    return thought


@router.get("/type/{thought_type}", response_model=List[ThoughtResponse])
async def get_thoughts_by_type(
    thought_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await thought_service.get_by_type(thought_type, skip, limit)