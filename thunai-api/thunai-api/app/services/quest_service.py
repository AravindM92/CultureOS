from typing import List
from app.services.base_service import BaseService
from app.repositories.quest_repository import QuestRepository
from app.models.schemas import QuestResponse


class QuestService(BaseService[QuestResponse]):
    def __init__(self):
        super().__init__(QuestRepository())
    
    def _map_to_model(self, data: dict) -> QuestResponse:
        return QuestResponse(**data)
    
    async def get_by_type(self, quest_type: str, skip: int = 0, limit: int = 100) -> List[QuestResponse]:
        data = await self.repository.find_by_type(quest_type, skip, limit)
        return [self._map_to_model(item) for item in data]