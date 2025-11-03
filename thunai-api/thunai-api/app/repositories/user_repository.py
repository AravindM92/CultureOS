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
    
    async def find_by_admin_status(self, is_admin: bool, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE is_admin = ? ORDER BY id LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (is_admin, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE name LIKE ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (f"%{name}%",))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def find_by_teams_user_id(self, teams_user_id: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE teams_user_id = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (teams_user_id,))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        query = """
        INSERT INTO users (teams_user_id, name, email, is_admin, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (user_data['teams_user_id'], user_data['name'], user_data['email'], 
                 user_data.get('is_admin', False))
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