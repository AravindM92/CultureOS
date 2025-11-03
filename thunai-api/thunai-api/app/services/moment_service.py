from typing import List, Optional
from app.services.base_service import BaseService
from app.repositories.moment_repository import MomentRepository
from app.repositories.user_repository import UserRepository
from app.models.schemas import MomentResponse, MomentCreate, MomentUpdate
from datetime import date
from fastapi import HTTPException


class MomentService(BaseService[MomentResponse]):
    def __init__(self):
        super().__init__(MomentRepository())
        self.user_repository = UserRepository()
    
    def _map_to_model(self, data: dict) -> MomentResponse:
        return MomentResponse(**data)
    
    async def create_moment(self, moment_data: MomentCreate) -> Optional[MomentResponse]:
        """Create a new moment - ONLY if celebrant exists in users table"""
        
        # CRITICAL VALIDATION: Check if person_name exists in users table
        user = await self.user_repository.find_by_name(moment_data.person_name)
        if not user:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot create moment: User '{moment_data.person_name}' not found in users table. Please add the user first."
            )
        
        # User exists - proceed with moment creation
        data = moment_data.model_dump()
        result = await self.repository.create(data)
        return self._map_to_model(result) if result else None
    
    async def update_moment(self, moment_id: int, update_data: MomentUpdate) -> Optional[MomentResponse]:
        """Update a moment"""
        data = update_data.model_dump(exclude_unset=True)
        result = await self.repository.update(moment_id, data)
        return self._map_to_model(result) if result else None
    
    async def get_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[MomentResponse]:
        """Get moments by user ID"""
        data = await self.repository.find_by_user_id(user_id, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_type(self, moment_type: str, skip: int = 0, limit: int = 100) -> List[MomentResponse]:
        """Get moments by type"""
        data = await self.repository.find_by_type(moment_type, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[MomentResponse]:
        """Get moments by status"""
        data = await self.repository.find_by_status(status, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_upcoming(self, days: int = 7) -> List[MomentResponse]:
        """Get upcoming moments in the next N days"""
        data = await self.repository.find_upcoming(days)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_date_range(self, start_date: date, end_date: date) -> List[MomentResponse]:
        """Get moments within a date range"""
        data = await self.repository.find_by_date_range(start_date, end_date)
        return [self._map_to_model(item) for item in data]
    
    async def mark_as_notified(self, moment_id: int) -> Optional[MomentResponse]:
        """Mark moment as notified (team has been notified)"""
        update_data = MomentUpdate(notified_at="datetime('now')")
        return await self.update_moment(moment_id, update_data)
    
    async def mark_as_completed(self, moment_id: int) -> Optional[MomentResponse]:
        """Mark moment as completed (greeting card sent)"""
        update_data = MomentUpdate(
            status="completed",
            completed_at="datetime('now')"
        )
        return await self.update_moment(moment_id, update_data)
    
    async def get_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[MomentResponse]:
        """Get moments by category (welcome/celebration/farewell)"""
        data = await self.repository.find_by_category(category, skip, limit)
        return [self._map_to_model(item) for item in data]
    
    async def get_moments_for_notification(self, target_date: date) -> List[MomentResponse]:
        """Get moments that need notification on target date"""
        data = await self.repository.find_for_notification(target_date)
        return [self._map_to_model(item) for item in data]