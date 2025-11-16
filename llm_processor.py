import openai
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ParsedPlan:
    plan_type: str  # 'weekly' or 'daily'
    date: str
    activities: List[str]
    wfo_days: List[str] = None  # For weekly plans

class LLMProcessor:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        
    def understand_user_input(self, user_input: str, context: str) -> ParsedPlan:
        """Parse user input and extract structured plan data"""
        
        # Determine if it's weekly or daily based on context
        plan_type = "weekly" if "week" in context.lower() else "daily"
        
        # Calculate target date
        today = datetime.now()
        if plan_type == "weekly":
            # Next Monday
            days_ahead = 7 - today.weekday()
            target_date = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        else:
            # Tomorrow
            target_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
        
        prompt = f"""
        Extract structured information from this user input about their {plan_type} plan:
        
        User input: "{user_input}"
        Context: {context}
        Target date: {target_date}
        
        Return JSON with:
        - activities: list of planned activities/tasks
        - wfo_days: list of work-from-office days (only for weekly, format: ["Monday", "Tuesday"])
        
        Example response:
        {{
            "activities": ["Team meeting", "Project review", "Client call"],
            "wfo_days": ["Monday", "Wednesday", "Friday"]
        }}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        try:
            parsed_data = json.loads(response.choices[0].message.content)
            return ParsedPlan(
                plan_type=plan_type,
                date=target_date,
                activities=parsed_data.get("activities", []),
                wfo_days=parsed_data.get("wfo_days") if plan_type == "weekly" else None
            )
        except:
            # Fallback parsing
            return ParsedPlan(
                plan_type=plan_type,
                date=target_date,
                activities=[user_input],
                wfo_days=["Monday", "Wednesday", "Friday"] if plan_type == "weekly" else None
            )