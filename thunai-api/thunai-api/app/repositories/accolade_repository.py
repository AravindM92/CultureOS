from typing import List, Dict, Any
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class AccoladeRepository(BaseRepository):
    def __init__(self):
        super().__init__("accolades")
    
    async def find_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM accolades WHERE user_id = ? ORDER BY achieved_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_type(self, accolade_type: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM accolades WHERE accolade_type = ? ORDER BY achieved_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (accolade_type, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]