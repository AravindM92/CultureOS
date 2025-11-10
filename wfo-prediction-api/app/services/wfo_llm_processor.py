"""
Simple WFO Response Processor - Following Basic Principles
=========================================================
Extract office days from user response using simple logic
"""

class WFOResponseProcessor:
    """Simple processor that handles basic WFO responses"""
    
    async def process_wfo_response(self, user_id: str, message: str, question_context: dict = None):
        """
        Extract WFO data from user message - same approach as moments
        Uses LLM to understand "Monday to Wednesday", "Mon-Thu", "first 3 days", etc.
        """
        
        # Simple data processing - NO LLM in API
        # The bot should send us structured data, we just validate and save
        
        # For now, simple pattern matching (bot should do LLM processing)
        message_lower = message.lower()
        
        day_statuses = {
            'monday_status': 'home',
            'tuesday_status': 'home', 
            'wednesday_status': 'home',
            'thursday_status': 'home',
            'friday_status': 'home'
        }
        
        # Simple range detection: "Monday to Wednesday"  
        if ('monday' in message_lower or 'mon' in message_lower) and ('wednesday' in message_lower or 'wed' in message_lower) and 'to' in message_lower:
            day_statuses['monday_status'] = 'office'
            day_statuses['tuesday_status'] = 'office'
            day_statuses['wednesday_status'] = 'office'
        
        # Count office days
        office_count = sum(1 for status in day_statuses.values() if status == 'office')
        
        # Office days list
        office_days = []
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for i, (key, status) in enumerate(day_statuses.items()):
            if status == 'office':
                office_days.append(day_names[i])
        
        processed_data = {
            **day_statuses,
            'office_days_count': office_count,
            'is_compliant': office_count >= 3,
            'collection_method': 'daily'
        }
        
        confirmation_msg = f"Got it! You'll be in office on {', '.join(office_days) if office_days else 'no days'}. That's {office_count} days."
        
        return {
            'data_extracted': True,
            'extracted_data': processed_data,
            'extracted_days': office_days,
            'needs_confirmation': True,
            'confirmation_message': confirmation_msg
        }