from typing import List, Optional
from app.services.base_service import BaseService
from app.repositories.greeting_repository import GreetingRepository
from app.models.schemas import GreetingResponse, GreetingCreate
from fastapi import HTTPException


class GreetingService(BaseService[GreetingResponse]):
    def __init__(self):
        super().__init__(GreetingRepository())
    
    def _map_to_model(self, data: dict) -> GreetingResponse:
        return GreetingResponse(**data)
    
    async def create_greeting(self, greeting_data: GreetingCreate) -> Optional[GreetingResponse]:
        """Create a new greeting (with duplicate check)"""
        # Check if user already sent a greeting for this moment
        existing = await self.repository.check_existing_greeting(
            greeting_data.moment_id, 
            greeting_data.user_id
        )
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="User has already sent a greeting for this moment"
            )
        
        data = greeting_data.model_dump()
        result = await self.repository.create(data)
        return self._map_to_model(result) if result else None
    
    async def get_by_moment_id(self, moment_id: int, skip: int = 0, limit: int = 100) -> List[GreetingResponse]:
        """Get all greetings for a specific moment"""
        data = await self.repository.find_by_moment_id(moment_id, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[GreetingResponse]:
        """Get all greetings by a specific user"""
        data = await self.repository.find_by_user_id(user_id, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_greeting_count(self, moment_id: int) -> int:
        """Get total number of greetings for a moment"""
        return await self.repository.count_greetings_for_moment(moment_id)