from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.accolade_service import AccoladeService
from app.models.schemas import AccoladeResponse

router = APIRouter(prefix="/accolades", tags=["accolades"])
accolade_service = AccoladeService()


@router.get("/", response_model=List[AccoladeResponse])
async def get_accolades(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    return await accolade_service.get_all(skip, limit)


@router.get("/{accolade_id}", response_model=AccoladeResponse)
async def get_accolade(accolade_id: int):
    accolade = await accolade_service.get_by_id(accolade_id)
    if not accolade:
        raise HTTPException(status_code=404, detail="Accolade not found")
    return accolade


@router.get("/user/{user_id}", response_model=List[AccoladeResponse])
async def get_accolades_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await accolade_service.get_by_user_id(user_id, skip, limit)


@router.get("/type/{accolade_type}", response_model=List[AccoladeResponse])
async def get_accolades_by_type(
    accolade_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await accolade_service.get_by_type(accolade_type, skip, limit)