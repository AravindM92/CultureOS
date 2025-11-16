from api_client import APIClient
from database import Database
from llm_processor import LLMProcessor
from datetime import datetime

class CultureBot:
    def __init__(self, api_key: str, db_path: str = "culture.db"):
        self.api_client = APIClient()
        self.db = Database(db_path)
        self.llm = LLMProcessor(api_key)
        self.context = {}
        
    def handle_message(self, user_input: str) -> str:
        user_input = user_input.lower().strip()
        
        # Check for plan requests
        if "week" in user_input:
            return self.ask_for_weekly_plan()
        elif "daily" in user_input or "tomorrow" in user_input:
            return self.ask_for_daily_plan()
        elif self.context.get("waiting_for") == "weekly_plan":
            return self.process_weekly_plan(user_input)
        elif self.context.get("waiting_for") == "daily_plan":
            return self.process_daily_plan(user_input)
        else:
            return "I can help you plan your week or daily schedule. Just say 'week' or 'daily'!"
    
    def ask_for_weekly_plan(self) -> str:
        self.context["waiting_for"] = "weekly_plan"
        return "What's your plan for next week? Tell me about your meetings, tasks, and preferred WFO days."
    
    def ask_for_daily_plan(self) -> str:
        self.context["waiting_for"] = "daily_plan"
        return "What's your plan for tomorrow? Share your schedule and tasks."
    
    def process_weekly_plan(self, user_input: str) -> str:
        try:
            # Use LLM to understand and parse user input
            parsed_plan = self.llm.understand_user_input(user_input, "weekly plan")
            
            # Call WFO API with parsed data
            wfo_data = {
                "employee_id": "user123",
                "week_start": parsed_plan.date,
                "wfo_days": parsed_plan.wfo_days or ["Monday", "Wednesday", "Friday"]
            }
            
            response = self.api_client.submit_wfo_plan(wfo_data)
            
            # Save to database
            self.db.save_plan({
                "type": "weekly",
                "date": parsed_plan.date,
                "content": user_input,
                "activities": parsed_plan.activities,
                "wfo_days": parsed_plan.wfo_days,
                "api_response": response
            })
            
            self.context.clear()
            wfo_days_str = ", ".join(parsed_plan.wfo_days or [])
            return f"Perfect! Your weekly plan is saved.\nWFO days: {wfo_days_str}\nActivities: {', '.join(parsed_plan.activities[:3])}{'...' if len(parsed_plan.activities) > 3 else ''}"
            
        except Exception as e:
            return f"Sorry, there was an error processing your plan: {str(e)}"
    
    def process_daily_plan(self, user_input: str) -> str:
        try:
            # Use LLM to understand and parse user input
            parsed_plan = self.llm.understand_user_input(user_input, "daily plan")
            
            # Save to database
            self.db.save_plan({
                "type": "daily",
                "date": parsed_plan.date,
                "content": user_input,
                "activities": parsed_plan.activities
            })
            
            self.context.clear()
            return f"Your daily plan is saved!\nFor {parsed_plan.date}: {', '.join(parsed_plan.activities[:3])}{'...' if len(parsed_plan.activities) > 3 else ''}\nHave a great day!"
            
        except Exception as e:
            return f"Sorry, there was an error saving your plan: {str(e)}"

if __name__ == "__main__":
    bot = CultureBot("your-openai-api-key")
    
    while True:
        user_msg = input("You: ")
        if user_msg.lower() == 'quit':
            break
        response = bot.handle_message(user_msg)
        print(f"Bot: {response}")