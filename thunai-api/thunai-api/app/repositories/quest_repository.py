from typing import List, Dict, Any
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class QuestRepository(BaseRepository):
    def __init__(self):
        super().__init__("quests")
    
    async def find_by_type(self, quest_type: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM quests WHERE quest_type = ? ORDER BY id LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (quest_type, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]