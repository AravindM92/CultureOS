import sqlite3
import json
from datetime import datetime
from typing import Dict, Any

class Database:
    def __init__(self, db_path: str = "culture.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    date TEXT NOT NULL,
                    content TEXT NOT NULL,
                    activities TEXT,
                    wfo_days TEXT,
                    api_response TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
    
    def save_plan(self, plan_data: Dict[str, Any]):
        """Save plan to database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO plans (type, date, content, activities, wfo_days, api_response)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                plan_data["type"],
                plan_data["date"],
                plan_data["content"],
                json.dumps(plan_data.get("activities", [])),
                json.dumps(plan_data.get("wfo_days", [])),
                json.dumps(plan_data.get("api_response", {}))
            ))