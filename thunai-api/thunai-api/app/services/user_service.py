from typing import List, Optional
from app.services.base_service import BaseService
from app.repositories.user_repository import UserRepository
from app.models.schemas import UserResponse, UserCreate, UserUpdate


class UserService(BaseService[UserResponse]):
    def __init__(self):
        super().__init__(UserRepository())
    
    def _map_to_model(self, data: dict) -> UserResponse:
        return UserResponse(**data)
    
    async def get_by_email(self, email: str) -> Optional[UserResponse]:
        data = await self.repository.find_by_email(email)
        return self._map_to_model(data) if data else None
    
    async def get_by_admin_status(self, is_admin: bool, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        data = await self.repository.find_by_admin_status(is_admin, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_name(self, name: str) -> Optional[UserResponse]:
        data = await self.repository.find_by_name(name)
        return self._map_to_model(data) if data else None
    
    async def get_by_teams_user_id(self, teams_user_id: str) -> Optional[UserResponse]:
        data = await self.repository.find_by_teams_user_id(teams_user_id)
        return self._map_to_model(data) if data else None
    
    async def create_user(self, user_create: UserCreate) -> UserResponse:
        user_data = user_create.model_dump()
        data = await self.repository.create(user_data)
        return self._map_to_model(data)
    
    async def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[UserResponse]:
        user_data = user_update.model_dump(exclude_unset=True)
        data = await self.repository.update(user_id, user_data)
        return self._map_to_model(data) if data else None