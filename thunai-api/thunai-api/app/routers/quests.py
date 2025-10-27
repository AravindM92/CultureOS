from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.quest_service import QuestService
from app.models.schemas import QuestResponse

router = APIRouter(prefix="/quests", tags=["quests"])
quest_service = QuestService()


@router.get("/", response_model=List[QuestResponse])
async def get_quests(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    return await quest_service.get_all(skip, limit)


@router.get("/{quest_id}", response_model=QuestResponse)
async def get_quest(quest_id: int):
    quest = await quest_service.get_by_id(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@router.get("/type/{quest_type}", response_model=List[QuestResponse])
async def get_quests_by_type(
    quest_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await quest_service.get_by_type(quest_type, skip, limit)