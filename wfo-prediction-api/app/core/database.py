import aiosqlite
from pathlib import Path
from contextlib import asynccontextmanager

class DatabaseManager:
    def __init__(self):
        # SQLite database path (same as thunai)
        self._db_path = str(Path(__file__).parent.parent.parent.parent / "database" / "thunai_culture.db")
    
    async def create_pool(self):
        # For SQLite, ensure database file exists
        if not Path(self._db_path).exists():
            raise RuntimeError(f"Database file not found: {self._db_path}")
        from app.core.config import settings
        if settings.enable_debug_logs:
            print(f"Using SQLite database: {self._db_path}")
    
    async def close_pool(self):
        # No pool to close for SQLite
        pass
    
    @asynccontextmanager
    async def get_connection(self):
        async with aiosqlite.connect(self._db_path) as connection:
            # Enable foreign key constraints
            await connection.execute("PRAGMA foreign_keys = ON")
            # Set row factory to return dict-like objects
            connection.row_factory = aiosqlite.Row
            yield connection


db_manager = DatabaseManager()