from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class WFOAvailabilityRepository(BaseRepository):
    def __init__(self):
        super().__init__("wfo_availability")
    
    async def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM wfo_availability WHERE user_id = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_week(self, week_start_date: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM wfo_availability WHERE week_start_date = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (week_start_date,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def create(self, wfo_data: Dict[str, Any]) -> Dict[str, Any]:
        query = """
        INSERT INTO wfo_availability (
            user_id, week_start_date, monday_status, tuesday_status, wednesday_status, 
            thursday_status, friday_status, office_days_count, is_compliant, collection_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (
                    wfo_data['user_id'], 
                    wfo_data['week_start_date'],
                    wfo_data.get('monday_status'),
                    wfo_data.get('tuesday_status'), 
                    wfo_data.get('wednesday_status'),
                    wfo_data.get('thursday_status'),
                    wfo_data.get('friday_status'),
                    wfo_data.get('office_days_count', 0),
                    wfo_data.get('is_compliant', False),
                    wfo_data.get('collection_method', 'daily')
                )
            )
            await conn.commit()
            availability_id = cursor.lastrowid
            
            # Return the created record
            return await self.find_by_id(availability_id)
    
    async def find_by_user_and_week(self, user_id: str, week_start_date: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM wfo_availability WHERE user_id = ? AND week_start_date = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, week_start_date))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def update_availability(self, user_id: str, week_start_date: str, wfo_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing WFO availability record"""
        query = """
        UPDATE wfo_availability SET 
            monday_status = ?, tuesday_status = ?, wednesday_status = ?, 
            thursday_status = ?, friday_status = ?, office_days_count = ?, 
            is_compliant = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND week_start_date = ?
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (
                    wfo_data.get('monday_status'),
                    wfo_data.get('tuesday_status'), 
                    wfo_data.get('wednesday_status'),
                    wfo_data.get('thursday_status'),
                    wfo_data.get('friday_status'),
                    wfo_data.get('office_days_count', 0),
                    wfo_data.get('is_compliant', False),
                    user_id,
                    week_start_date
                )
            )
            await conn.commit()
            
            if cursor.rowcount > 0:
                return await self.find_by_user_and_week(user_id, week_start_date)
            return None