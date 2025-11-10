from pathlib import Path


class Settings:
    app_name: str = "WFO Prediction API"
    host: str = "0.0.0.0" 
    port: int = 8001
    
    # Database settings (use same database as thunai for consistency)
    database_url: str = str(Path(__file__).parent.parent.parent.parent / "database" / "thunai_culture.db")
    
    # CORS settings
    allowed_origins: list = ["*"]
    
    # Debug settings
    enable_debug_logs: bool = True


settings = Settings()