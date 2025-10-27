from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic
from app.repositories.base import BaseRepository

T = TypeVar('T')


class BaseService(ABC, Generic[T]):
    def __init__(self, repository: BaseRepository):
        self.repository = repository
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        data = await self.repository.find_all(skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_id(self, id: int) -> Optional[T]:
        data = await self.repository.find_by_id(id)
        return self._map_to_model(data) if data else None
    
    async def get_count(self) -> int:
        return await self.repository.count()
    
    @abstractmethod
    def _map_to_model(self, data: dict) -> T:
        pass