from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # SQLite database path
    database_url: str = str(Path(__file__).parent.parent.parent.parent / "database" / "thunai_culture.db")
    app_name: str = "Thunai Culture OS API"
    debug: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()