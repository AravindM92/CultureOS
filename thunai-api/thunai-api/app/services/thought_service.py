from typing import List
from app.services.base_service import BaseService
from app.repositories.thought_repository import ThoughtRepository
from app.models.schemas import ThoughtResponse


class ThoughtService(BaseService[ThoughtResponse]):
    def __init__(self):
        super().__init__(ThoughtRepository())
    
    def _map_to_model(self, data: dict) -> ThoughtResponse:
        return ThoughtResponse(**data)
    
    async def get_by_type(self, thought_type: str, skip: int = 0, limit: int = 100) -> List[ThoughtResponse]:
        data = await self.repository.find_by_type(thought_type, skip, limit)
        return [self._map_to_model(item) for item in data]