from typing import List, Optional
from app.services.base_service import BaseService
from app.repositories.wfo_availability_repository import WFOAvailabilityRepository
from app.repositories.wfo_collection_attempts_repository import WFOCollectionAttemptsRepository


class WFOAvailabilityService(BaseService):
    def __init__(self):
        super().__init__(WFOAvailabilityRepository())
        self.attempts_repo = WFOCollectionAttemptsRepository()
    
    def _map_to_model(self, data: dict) -> dict:
        # For now, return the data as-is (can add model mapping later)
        return data
    
    async def get_by_user_id(self, user_id: str) -> List[dict]:
        data = await self.repository.find_by_user_id(user_id)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_week(self, week_start_date: str) -> List[dict]:
        data = await self.repository.find_by_week(week_start_date)
        return [self._map_to_model(item) for item in data]
    
    async def get_by_user_and_week(self, user_id: str, week_start_date: str) -> Optional[dict]:
        data = await self.repository.find_by_user_and_week(user_id, week_start_date)
        return self._map_to_model(data) if data else None
    
    async def create_or_update_availability(self, wfo_data: dict) -> dict:
        """Create new or update existing WFO availability"""
        existing = await self.repository.find_by_user_and_week(
            wfo_data['user_id'], 
            wfo_data['week_start_date']
        )
        
        if existing:
            # Update existing record
            data = await self.repository.update_availability(
                wfo_data['user_id'], 
                wfo_data['week_start_date'], 
                wfo_data
            )
        else:
            # Create new record
            data = await self.repository.create(wfo_data)
            
        return self._map_to_model(data)
    
    async def check_data_needed(self, user_id: str, week_start_date: str) -> dict:
        """Check if WFO data collection is needed for user"""
        # Get current availability data
        availability = await self.repository.find_by_user_and_week(user_id, week_start_date)
        
        # Count collection attempts for the week
        attempt_count = await self.attempts_repo.count_attempts_for_week(user_id, week_start_date)
        
        office_days_count = 0
        if availability:
            office_days_count = availability.get('office_days_count', 0)
        
        collection_needed = office_days_count < 3  # Minimum 3 days required
        
        return {
            "user_id": user_id,
            "collection_needed": collection_needed,
            "office_days_count": office_days_count,
            "min_required": 3,
            "attempt_count": attempt_count,
            "reason": f"Current office days: {office_days_count}/3 minimum required"
        }