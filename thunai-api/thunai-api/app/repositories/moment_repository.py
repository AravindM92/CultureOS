from typing import List, Dict, Any, Optional
from app.repositories.base import BaseRepository
from app.core.database import db_manager
from datetime import date


class MomentRepository(BaseRepository):
    def __init__(self):
        super().__init__("moments")
    
    async def create(self, moment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new moment"""
        query = """
            INSERT INTO moments (user_id, celebration_date, moment_type, moment_category, title, description, created_by, celebrant_user_id, notification_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(
                query,
                (moment_data['user_id'], moment_data['celebration_date'], moment_data['moment_type'],
                 moment_data.get('moment_category', 'celebration'), moment_data['title'], 
                 moment_data.get('description'), moment_data['created_by'],
                 moment_data.get('celebrant_user_id'), moment_data.get('notification_days', 1))
            )
            await conn.commit()
            moment_id = cursor.lastrowid
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
        query = "SELECT * FROM moments WHERE user_id = ? ORDER BY celebration_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (user_id, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_type(self, moment_type: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by type"""
        query = "SELECT * FROM moments WHERE moment_type = ? ORDER BY celebration_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (moment_type, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by status"""
        query = "SELECT * FROM moments WHERE status = ? ORDER BY celebration_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (status, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_upcoming(self, days: int = 7) -> List[Dict[str, Any]]:
        """Find upcoming moments in the next N days"""
        query = """
            SELECT * FROM moments 
            WHERE status = 'active' 
            AND celebration_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
            ORDER BY celebration_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (days,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_date_range(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Find moments within a date range"""
        query = """
            SELECT * FROM moments 
            WHERE celebration_date BETWEEN ? AND ?
            ORDER BY celebration_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (start_date, end_date))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find moments by category (welcome/celebration/farewell)"""
        query = "SELECT * FROM moments WHERE moment_category = ? ORDER BY celebration_date DESC LIMIT ? OFFSET ?"
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (category, limit, skip))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def find_for_notification(self, target_date: date) -> List[Dict[str, Any]]:
        """Find moments that need notification on target date"""
        query = """
            SELECT m.*, u.name as celebrant_name, u.teams_user_id as celebrant_teams_id
            FROM moments m
            LEFT JOIN users u ON m.celebrant_user_id = u.id
            WHERE m.status = 'active' 
            AND date(m.celebration_date, '-' || m.notification_days || ' days') = ?
            AND m.notified_at IS NULL
            ORDER BY m.celebration_date ASC
        """
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute(query, (target_date,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]