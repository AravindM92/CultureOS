from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class WFOScheduledMessagesRepository(BaseRepository):
    def __init__(self):
        super().__init__("wfo_scheduled_messages")
    
    async def find_pending_messages(self) -> List[Dict[str, Any]]:
        query = "SELECT * FROM wfo_scheduled_messages WHERE status = 'pending' ORDER BY scheduled_for ASC"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query)
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_user_and_week(self, user_id: str, week_target: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM wfo_scheduled_messages WHERE user_id = ? AND week_target = ? ORDER BY scheduled_for DESC"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, week_target))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def create_scheduled_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        query = """
        INSERT INTO wfo_scheduled_messages (
            user_id, message_type, scheduled_for, week_target, status
        ) VALUES (?, ?, ?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (
                    message_data['user_id'],
                    message_data['message_type'],
                    message_data['scheduled_for'],
                    message_data['week_target'],
                    message_data.get('status', 'pending')
                )
            )
            await conn.commit()
            message_id = cursor.lastrowid
            
            return await self.find_by_id(message_id)
    
    async def update_message_status(self, message_id: int, status: str, timestamp_field: str = None) -> Optional[Dict[str, Any]]:
        """Update message status and optionally set timestamp field"""
        if timestamp_field:
            query = f"UPDATE wfo_scheduled_messages SET status = ?, {timestamp_field} = CURRENT_TIMESTAMP WHERE id = ?"
        else:
            query = "UPDATE wfo_scheduled_messages SET status = ? WHERE id = ?"
        
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (status, message_id))
            await conn.commit()
            
            if cursor.rowcount > 0:
                return await self.find_by_id(message_id)
            return None