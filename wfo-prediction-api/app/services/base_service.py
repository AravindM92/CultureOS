from abc import ABC, abstractmethod
from typing import List, Optional, Any


class BaseService(ABC):
    def __init__(self, repository):
        self.repository = repository
    
    @abstractmethod
    def _map_to_model(self, data: dict) -> Any:
        """Map raw data to model"""
        pass
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Any]:
        data = await self.repository.find_all(skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_id(self, id: int) -> Optional[Any]:
        data = await self.repository.find_by_id(id)
        return self._map_to_model(data) if data else None
    
    async def count(self) -> int:
        return await self.repository.count()