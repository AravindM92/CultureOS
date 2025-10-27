from typing import List
from app.services.base_service import BaseService
from app.repositories.gossip_repository import GossipRepository
from app.models.schemas import GossipResponse


class GossipService(BaseService[GossipResponse]):
    def __init__(self):
        super().__init__(GossipRepository())
    
    def _map_to_model(self, data: dict) -> GossipResponse:
        return GossipResponse(**data)
    
    async def get_by_type(self, gossip_type: str, skip: int = 0, limit: int = 100) -> List[GossipResponse]:
        data = await self.repository.find_by_type(gossip_type, skip, limit)
        return [self._map_to_model(item) for item in data]