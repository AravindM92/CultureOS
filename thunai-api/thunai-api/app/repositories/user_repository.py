from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")
    
    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE email = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (email,))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def find_by_job_level(self, job_level: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE job_level = ? ORDER BY id LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (job_level, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        query = """
        INSERT INTO users (name, email, date_of_birth, date_of_joining, last_working_date, job_level, roleid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (user_data['name'], user_data['email'], user_data['date_of_birth'],
                 user_data['date_of_joining'], user_data.get('last_working_date'),
                 user_data['job_level'], user_data['roleid'])
            )
            await conn.commit()
            user_id = cursor.lastrowid
            return await self.find_by_id(user_id)
    
    async def update(self, user_id: int, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        set_clauses = []
        values = []
        
        for key, value in user_data.items():
            if value is not None:
                set_clauses.append(f"{key} = ?")
                values.append(value)
        
        if not set_clauses:
            return await self.find_by_id(user_id)
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ?"
        
        async with db_manager.get_connection() as conn:
            await conn.execute(query, values)
            await conn.commit()
            return await self.find_by_id(user_id)