from abc import ABC, abstractmethod
from typing import List, Optional, Any, Dict
from app.core.database import db_manager


class BaseRepository(ABC):
    def __init__(self, table_name: str):
        self.table_name = table_name
    
    async def find_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = f"SELECT * FROM {self.table_name} ORDER BY id LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        query = f"SELECT * FROM {self.table_name} WHERE id = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (id,))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def count(self) -> int:
        query = f"SELECT COUNT(*) FROM {self.table_name}"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query)
            row = await cursor.fetchone()
            return row[0] if row else 0