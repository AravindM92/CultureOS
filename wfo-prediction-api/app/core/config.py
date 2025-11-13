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
    
    # WFO Collection Prompts - Configurable message templates
    wfo_prompts = {
        "daily": {
            "message_template": "Hope your day went well! Are you planning to be in the office tomorrow?",
            "llm_instruction": "Process response to extract office plans. User may respond about tomorrow only or multiple days. Extract all available WFO data from response.",
        },
        "weekly": {
            "message_template": "Hope your day went well! Could you share your office plans for next week? (Monday to Friday)",
            "llm_instruction": "Process response to extract WFO plans for the full week Monday-Friday. User may specify specific days or general patterns.",
        }
    }


settings = Settings()