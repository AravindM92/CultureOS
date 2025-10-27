from typing import List
from app.services.base_service import BaseService
from app.repositories.accolade_repository import AccoladeRepository
from app.models.schemas import AccoladeResponse


class AccoladeService(BaseService[AccoladeResponse]):
    def __init__(self):
        super().__init__(AccoladeRepository())
    
    def _map_to_model(self, data: dict) -> AccoladeResponse:
        return AccoladeResponse(**data)
    
    async def get_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[AccoladeResponse]:
        data = await self.repository.find_by_user_id(user_id, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_type(self, accolade_type: str, skip: int = 0, limit: int = 100) -> List[AccoladeResponse]:
        data = await self.repository.find_by_type(accolade_type, skip, limit)
        return [self._map_to_model(item) for item in data]