from typing import List, Dict, Any
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class GreetingRepository(BaseRepository):
    def __init__(self):
        super().__init__("greetings")
    
    async def create(self, greeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new greeting"""
        query = """
            INSERT INTO greetings (moment_id, user_id, greeting_text)
            VALUES (?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (greeting_data['moment_id'], greeting_data['user_id'], greeting_data['greeting_text'])
            )
            await conn.commit()
            greeting_id = cursor.lastrowid
            return await self.find_by_id(greeting_id)
    
    async def find_by_moment_id(self, moment_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find all greetings for a specific moment"""
        query = "SELECT * FROM greetings WHERE moment_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (moment_id, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find all greetings by a specific user"""
        query = "SELECT * FROM greetings WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def check_existing_greeting(self, moment_id: int, user_id: int) -> bool:
        """Check if user already sent a greeting for this moment"""
        query = "SELECT id FROM greetings WHERE moment_id = ? AND user_id = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (moment_id, user_id))
            row = await cursor.fetchone()
            return row is not None
    
    async def count_greetings_for_moment(self, moment_id: int) -> int:
        """Count total greetings for a moment"""
        query = "SELECT COUNT(*) FROM greetings WHERE moment_id = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (moment_id,))
            row = await cursor.fetchone()
            return row[0] if row else 0