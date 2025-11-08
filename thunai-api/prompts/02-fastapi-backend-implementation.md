# FastAPI Backend Implementation - CultureOS

## Overview
Create a robust FastAPI backend that serves as the data layer for CultureOS, handling users, moments, greetings, and all team culture management operations.

## Architecture & Features

### 🎯 **Core Requirements**
- **FastAPI Framework**: Modern Python web API with automatic docs
- **SQLite Database**: Local file-based database with relationships  
- **CORS Support**: Enable Teams bot communication
- **Repository Pattern**: Clean separation of data access
- **Service Layer**: Business logic abstraction
- **Async Operations**: Non-blocking database operations
- **Health Checks**: API monitoring endpoints

### 🏗️ **Project Structure**
```
thunai-api/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
└── app/
    ├── __init__.py
    ├── core/
    │   ├── __init__.py
    │   ├── config.py       # Configuration settings
    │   └── database.py     # Database connection management
    ├── models/
    │   ├── __init__.py
    │   └── schemas.py      # Pydantic models for API
    ├── repositories/
    │   ├── __init__.py
    │   ├── base.py         # Base repository class
    │   ├── user_repository.py
    │   ├── moment_repository.py
    │   ├── greeting_repository.py
    │   ├── accolade_repository.py
    │   ├── gossip_repository.py
    │   ├── quest_repository.py
    │   └── thought_repository.py
    ├── services/
    │   ├── __init__.py
    │   ├── base_service.py
    │   ├── user_service.py
    │   ├── moment_service.py
    │   ├── greeting_service.py
    │   ├── accolade_service.py
    │   ├── gossip_service.py
    │   ├── quest_service.py
    │   └── thought_service.py
    └── routers/
        ├── __init__.py
        ├── users.py        # User management endpoints
        ├── moments.py      # Moment management endpoints
        ├── moment_analysis.py # AI analysis endpoints
        ├── greetings.py    # Greeting management endpoints
        ├── accolades.py    # Accolade endpoints
        ├── gossips.py      # Gossip endpoints  
        ├── quests.py       # Quest endpoints
        └── thoughts.py     # Thought endpoints
```

## 🔧 **Implementation Details**

### **1. Main Application (main.py)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import db_manager
from app.core.config import settings
from app.routers import (users, accolades, gossips, quests, 
                        thoughts, moments, greetings, moment_analysis)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connection
    await db_manager.create_pool()
    yield
    # Shutdown: Close database connections
    await db_manager.close_pool()

app = FastAPI(
    title=settings.app_name,
    description="API for managing team culture, moments, and engagement",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Teams bot communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(users.router, prefix="/api/v1")
app.include_router(moments.router, prefix="/api/v1") 
app.include_router(moment_analysis.router, prefix="/api/v1")
app.include_router(greetings.router, prefix="/api/v1")
# ... other routers

@app.get("/")
async def root():
    return {"message": "Thunai Culture OS API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
```

### **2. Configuration (app/core/config.py)**
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "Thunai Culture OS API"
    database_url: str = "sqlite:///./thunai_culture.db"
    allowed_origins: List[str] = ["*"]
    enable_debug_logs: bool = True
    
    # API Configuration
    api_version: str = "v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### **3. Database Management (app/core/database.py)**
```python
import aiosqlite
import asyncio
from typing import Optional
from app.core.config import settings

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[aiosqlite.Connection] = None
        self.database_url = settings.database_url.replace("sqlite:///", "")
    
    async def create_pool(self):
        """Create database connection pool"""
        self.pool = await aiosqlite.connect(
            self.database_url,
            check_same_thread=False
        )
        self.pool.row_factory = aiosqlite.Row
        await self._create_tables()
    
    async def close_pool(self):
        """Close database connections"""
        if self.pool:
            await self.pool.close()
    
    async def get_connection(self) -> aiosqlite.Connection:
        """Get database connection"""
        if not self.pool:
            await self.create_pool()
        return self.pool
    
    async def _create_tables(self):
        """Initialize database tables if they don't exist"""
        # Read and execute database schema
        with open("database_complete.sql", "r") as f:
            schema = f.read()
        await self.pool.executescript(schema)
        await self.pool.commit()

# Global database manager instance
db_manager = DatabaseManager()
```

### **4. Pydantic Models (app/models/schemas.py)**
```python
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class MomentType(str, Enum):
    birthday = "birthday"
    work_anniversary = "work_anniversary" 
    lwd = "lwd"
    promotion = "promotion"
    new_hire = "new_hire"
    achievement = "achievement"
    other = "other"

# User Models
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    teams_user_id: str

class UserCreate(UserBase):
    is_admin: bool = False

class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    updated_at: datetime

# Moment Models  
class MomentBase(BaseModel):
    person_name: str
    moment_type: MomentType
    moment_date: date
    description: Optional[str] = None

class MomentCreate(MomentBase):
    created_by: str
    tags: Optional[List[str]] = []
    user_id: Optional[int] = None

class MomentResponse(MomentBase):
    id: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    notification_sent: bool
    tags: Optional[str] = None
    user_id: Optional[int] = None

# Greeting Models
class GreetingBase(BaseModel):
    moment_type: MomentType
    greeting_text: str

class GreetingCreate(GreetingBase):
    pass

class GreetingResponse(GreetingBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### **5. Repository Layer (app/repositories/user_repository.py)**
```python
from typing import List, Optional
import aiosqlite
from app.models.schemas import UserCreate, UserResponse
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    
    async def create(self, user: UserCreate) -> UserResponse:
        """Create a new user"""
        query = """
        INSERT INTO users (teams_user_id, name, email, is_admin)
        VALUES (?, ?, ?, ?)
        RETURNING *
        """
        async with await self.get_connection() as conn:
            cursor = await conn.execute(
                query, 
                (user.teams_user_id, user.name, user.email, user.is_admin)
            )
            row = await cursor.fetchone()
            await conn.commit()
            return UserResponse(**dict(row))
    
    async def get_by_teams_id(self, teams_user_id: str) -> Optional[UserResponse]:
        """Get user by Teams user ID"""
        query = "SELECT * FROM users WHERE teams_user_id = ?"
        async with await self.get_connection() as conn:
            cursor = await conn.execute(query, (teams_user_id,))
            row = await cursor.fetchone()
            if row:
                return UserResponse(**dict(row))
            return None
    
    async def get_all(self) -> List[UserResponse]:
        """Get all users"""
        query = "SELECT * FROM users ORDER BY created_at DESC"
        async with await self.get_connection() as conn:
            cursor = await conn.execute(query)
            rows = await cursor.fetchall()
            return [UserResponse(**dict(row)) for row in rows]
    
    async def update(self, user_id: int, user_data: dict) -> Optional[UserResponse]:
        """Update user by ID"""
        set_clause = ", ".join([f"{k} = ?" for k in user_data.keys()])
        query = f"""
        UPDATE users 
        SET {set_clause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING *
        """
        async with await self.get_connection() as conn:
            cursor = await conn.execute(
                query, 
                list(user_data.values()) + [user_id]
            )
            row = await cursor.fetchone()
            await conn.commit()
            if row:
                return UserResponse(**dict(row))
            return None
    
    async def delete(self, user_id: int) -> bool:
        """Delete user by ID"""
        query = "DELETE FROM users WHERE id = ?"
        async with await self.get_connection() as conn:
            cursor = await conn.execute(query, (user_id,))
            await conn.commit()
            return cursor.rowcount > 0
```

### **6. Service Layer (app/services/user_service.py)**
```python
from typing import List, Optional
from app.models.schemas import UserCreate, UserResponse
from app.repositories.user_repository import UserRepository

class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
    
    async def create_user(self, user: UserCreate) -> UserResponse:
        """Create a new user with validation"""
        # Check if user already exists
        existing = await self.user_repository.get_by_teams_id(user.teams_user_id)
        if existing:
            raise ValueError(f"User with Teams ID {user.teams_user_id} already exists")
        
        return await self.user_repository.create(user)
    
    async def get_user_by_teams_id(self, teams_user_id: str) -> Optional[UserResponse]:
        """Get user by Teams ID"""
        return await self.user_repository.get_by_teams_id(teams_user_id)
    
    async def get_all_users(self) -> List[UserResponse]:
        """Get all users"""
        return await self.user_repository.get_all()
    
    async def update_user(self, user_id: int, user_data: dict) -> Optional[UserResponse]:
        """Update user with validation"""
        return await self.user_repository.update(user_id, user_data)
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete user"""
        return await self.user_repository.delete(user_id)

# Global service instance
user_service = UserService()
```

### **7. API Endpoints (app/routers/users.py)**
```python
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import UserCreate, UserResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create a new user"""
    try:
        return await user_service.create_user(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[UserResponse])
async def get_users():
    """Get all users"""
    return await user_service.get_all_users()

@router.get("/teams/{teams_user_id}", response_model=UserResponse)
async def get_user_by_teams_id(teams_user_id: str):
    """Get user by Teams user ID"""
    user = await user_service.get_user_by_teams_id(teams_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with Teams ID {teams_user_id} not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: dict):
    """Update user by ID"""
    user = await user_service.update_user(user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """Delete user by ID"""
    success = await user_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return {"message": "User deleted successfully"}
```

## 📦 **Dependencies (requirements.txt)**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
aiosqlite==0.19.0
python-multipart==0.0.6
email-validator==2.1.0
```

## 🔧 **API Endpoints Summary**

### **Users** (`/api/v1/users`)
- `POST /` - Create user
- `GET /` - List all users  
- `GET /teams/{teams_user_id}` - Get user by Teams ID
- `PUT /{user_id}` - Update user
- `DELETE /{user_id}` - Delete user

### **Moments** (`/api/v1/moments`)
- `POST /` - Create moment
- `GET /` - List all moments
- `GET /{moment_id}` - Get moment by ID
- `PUT /{moment_id}` - Update moment
- `DELETE /{moment_id}` - Delete moment

### **Greetings** (`/api/v1/greetings`)
- `POST /` - Create greeting
- `GET /` - List greetings
- `GET /{greeting_id}` - Get greeting by ID
- `PUT /{greeting_id}` - Update greeting
- `DELETE /{greeting_id}` - Delete greeting

### **Moment Analysis** (`/api/v1/moment-analysis`)
- `POST /analyze` - Analyze text for moments
- `GET /suggestions` - Get moment suggestions

## 🧪 **Testing**

### **Manual Testing with FastAPI Docs**
1. Start server: `uvicorn main:app --reload --port 8000`
2. Open: `http://localhost:8000/docs`
3. Test all endpoints with interactive Swagger UI

### **Test Data Examples**
```json
// Create User
{
  "name": "Sarah Johnson",
  "email": "sarah@company.com",
  "teams_user_id": "sarah.johnson@company.com"
}

// Create Moment
{
  "person_name": "Sarah Johnson",
  "moment_type": "birthday",
  "moment_date": "2025-11-15",
  "description": "Sarah's birthday celebration",
  "created_by": "admin@company.com"
}
```

## 🚀 **Deployment**

### **Local Development**
```bash
# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --port 8000

# API will be available at:
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
# - Health: http://localhost:8000/health
```

### **Environment Variables (.env)**
```bash
# Database
DATABASE_URL=sqlite:///./thunai_culture.db

# API Configuration  
APP_NAME=Thunai Culture OS API
ALLOWED_ORIGINS=["*"]
ENABLE_DEBUG_LOGS=true

# Server
HOST=0.0.0.0
PORT=8000
```

---
**Next Step**: Set up the database schema (see `03-database-schema-implementation.md`)