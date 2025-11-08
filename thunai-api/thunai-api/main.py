from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import db_manager
from app.core.config import settings
from app.routers import users, accolades, gossips, quests, thoughts, moments, greetings, moment_analysis


async def lifespan(app: FastAPI):
    await db_manager.create_pool()
    if settings.enable_debug_logs:
        print("Database connected successfully!")
    
    yield
    
    await db_manager.close_pool()
    if settings.enable_debug_logs:
        print("Database connection closed.")


app = FastAPI(
    title=settings.app_name,
    description="API for managing team culture, moments, and engagement",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Teams bot
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(users.router, prefix="/api/v1")
app.include_router(moments.router, prefix="/api/v1")
app.include_router(moment_analysis.router, prefix="/api/v1")
app.include_router(greetings.router, prefix="/api/v1")
app.include_router(accolades.router, prefix="/api/v1")
app.include_router(gossips.router, prefix="/api/v1")
app.include_router(quests.router, prefix="/api/v1")
app.include_router(thoughts.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Thunai Culture OS API", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)