from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.services.user_service import UserService
from app.models.schemas import UserResponse, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
user_service = UserService()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    return await user_service.get_all(skip, limit)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str):
    user = await user_service.get_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/admin/{is_admin}", response_model=List[UserResponse])
async def get_users_by_admin_status(
    is_admin: bool,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await user_service.get_by_admin_status(is_admin, skip, limit)


@router.get("/name/{name}", response_model=UserResponse)
async def get_user_by_name(name: str):
    user = await user_service.get_by_name(name)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/teams-id/{teams_user_id}", response_model=UserResponse)
async def get_user_by_teams_id(teams_user_id: str):
    user = await user_service.get_by_teams_user_id(teams_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_create: UserCreate):
    return await user_service.create_user(user_create)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    user = await user_service.update_user(user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user