from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # SQLite database path
    database_url: str = str(Path(__file__).parent.parent.parent.parent / "database" / "thunai_culture.db")
    app_name: str = "Thunai Culture OS API"
    debug: bool = True
    
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS configuration
    allowed_origins: list = ["http://localhost:3978", "http://127.0.0.1:3978"]
    
    # Logging configuration
    log_level: str = "INFO"
    enable_debug_logs: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()