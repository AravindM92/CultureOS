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
        
        # NO LLM LOGIC IN API - Bot must send structured data
        # API only handles simple pattern matching as fallback
        
        # Enhanced range detection for various day patterns
        day_patterns = {
            'monday': ['monday', 'mon'],
            'tuesday': ['tuesday', 'tues', 'tue'],
            'wednesday': ['wednesday', 'wed'],
            'thursday': ['thursday', 'thurs', 'thu'],
            'friday': ['friday', 'fri']
        }
        
        # Find start and end days in ranges like "Tues to Thurs", "Mon-Wed", etc.
        if 'to' in message_lower or '-' in message_lower:
            days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            found_start = None
            found_end = None
            for day_name, patterns in day_patterns.items():
                for pattern in patterns:
                    if pattern in message_lower:
                        if found_start is None:
                            found_start = day_name
                        else:
                            found_end = day_name
                            break
            # If we found a range, mark those days as office
            if found_start and found_end:
                start_idx = days_order.index(found_start)
                end_idx = days_order.index(found_end)
                for i in range(start_idx, end_idx + 1):
                    day_key = f"{days_order[i]}_status"
                    day_statuses[day_key] = 'office'
        
        # Individual day detection (for cases like "Monday and Wednesday")
        for day_name, patterns in day_patterns.items():
            for pattern in patterns:
                if pattern in message_lower:
                    day_key = f"{day_name}_status"
                    day_statuses[day_key] = 'office'
        
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
        
