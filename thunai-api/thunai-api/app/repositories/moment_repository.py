from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager
from datetime import date


class MomentRepository(BaseRepository):
    def __init__(self):
        super().__init__("moments")
    
    async def create(self, moment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new moment"""
        # First validate that person_name exists in users table
        user_query = "SELECT teams_user_id FROM users WHERE name = ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(user_query, (moment_data['person_name'],))
            user = await cursor.fetchone()
            
            if not user:
                raise ValueError(f"User '{moment_data['person_name']}' not found in users table. Please add the user first.")
            
            # Create the moment with correct column names
            query = """
                INSERT INTO moments (person_name, moment_type, moment_date, description, created_by, created_at, updated_at, is_active, notification_sent)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0)
            """
            cursor = await conn.execute(
                query,
                (moment_data['person_name'], moment_data['moment_type'], moment_data['moment_date'],
                 moment_data.get('description'), moment_data['created_by'])
            )
            await conn.commit()
            moment_id = cursor.lastrowid
            print(f"Moment created in database with ID: {moment_id}")
            return await self.find_by_id(moment_id)
    
    async def update(self, moment_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a moment"""
        # Build dynamic update query
        set_clauses = []
        values = []
        
        for key, value in update_data.items():
            if value is not None:
                set_clauses.append(f"{key} = ?")
                values.append(value)
        
        if not set_clauses:
            return None
            
        values.append(moment_id)
        query = f"UPDATE moments SET {', '.join(set_clauses)} WHERE id = ?"
        
        async with db_manager.get_connection() as conn:
            await conn.execute(query, values)
            await conn.commit()
            return await self.find_by_id(moment_id)
    
    async def find_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by user ID"""
        query = "SELECT * FROM moments WHERE person_name IN (SELECT name FROM users WHERE id = ?) ORDER BY moment_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_type(self, moment_type: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by type"""
        query = "SELECT * FROM moments WHERE moment_type = ? ORDER BY moment_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (moment_type, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by status"""
        query = "SELECT * FROM moments WHERE is_active = ? ORDER BY moment_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            is_active = 1 if status == 'active' else 0
            cursor = await conn.execute(query, (is_active, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_upcoming(self, days: int = 7) -> List[Dict[str, Any]]:
        """Find upcoming moments in the next N days"""
        query = """
            SELECT * FROM moments 
            WHERE is_active = 1 
            AND moment_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
            ORDER BY moment_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (days,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_date_range(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Find moments within a date range"""
        query = """
            SELECT * FROM moments 
            WHERE moment_date BETWEEN ? AND ?
            ORDER BY moment_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (start_date, end_date))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by category (welcome/celebration/farewell)"""
        query = "SELECT * FROM moments WHERE moment_type = ? ORDER BY moment_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (category, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_for_notification(self, target_date: date) -> List[Dict[str, Any]]:
        """Find moments that need notification on target date"""
        query = """
            SELECT m.*, u.name as celebrant_name, u.teams_user_id as celebrant_teams_id
            FROM moments m
            LEFT JOIN users u ON m.person_name = u.name
            WHERE m.is_active = 1 
            AND m.moment_date = ?
            AND m.notification_sent = 0
            ORDER BY m.moment_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (target_date,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]