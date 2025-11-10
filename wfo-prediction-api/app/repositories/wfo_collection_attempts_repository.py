from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class WFOCollectionAttemptsRepository(BaseRepository):
    def __init__(self):
        super().__init__("wfo_collection_attempts")
    
    async def find_by_user_and_week(self, user_id: str, week_start_date: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM wfo_collection_attempts WHERE user_id = ? AND week_start_date = ? ORDER BY attempt_timestamp DESC"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, week_start_date))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def create_attempt(self, attempt_data: Dict[str, Any]) -> Dict[str, Any]:
        query = """
        INSERT INTO wfo_collection_attempts (
            user_id, week_start_date, attempt_type, response_received, 
            response_data, success, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (
                    attempt_data['user_id'],
                    attempt_data['week_start_date'],
                    attempt_data['attempt_type'],
                    attempt_data.get('response_received', False),
                    attempt_data.get('response_data'),
                    attempt_data.get('success', False),
                    attempt_data.get('reason')
                )
            )
            await conn.commit()
            attempt_id = cursor.lastrowid
            
            return await self.find_by_id(attempt_id)
    
    async def count_attempts_for_week(self, user_id: str, week_start_date: str) -> int:
        query = "SELECT COUNT(*) FROM wfo_collection_attempts WHERE user_id = ? AND week_start_date = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, week_start_date))
            row = await cursor.fetchone()
            return row[0] if row else 0