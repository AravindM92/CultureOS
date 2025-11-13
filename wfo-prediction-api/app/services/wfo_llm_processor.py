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
        
        # LLM-based context-aware processing
        # Use the question context and user response to intelligently extract office plans
        if question_context:
            message_template = question_context.get('message_template', '')
            collection_type = question_context.get('collection_type', 'weekly')
            
            # Create contextual prompt for LLM to understand the Q&A relationship
            context_prompt = f"""
Question asked: "{message_template}"
User response: "{message}"
Collection type: {collection_type}

Based on the question and user's response, extract their office plans for the week (Monday-Friday).

If the question asks about "tomorrow" and user says "yes", determine which day tomorrow is and mark that as office.
If the question asks about "next week" and user gives days, extract those specific days.
If user gives ranges like "Mon to Wed" or "Tuesday-Thursday", extract all days in that range.

Return the office status for each day as JSON:
{{
    "monday_status": "office" or "home",
    "tuesday_status": "office" or "home", 
    "wednesday_status": "office" or "home",
    "thursday_status": "office" or "home",
    "friday_status": "office" or "home"
}}
"""
            
            # Call LLM for intelligent context-aware extraction
            try:
                # Updated system prompt: Only reference moments if provided, otherwise do not mention celebrations or events.
                llm_result, raw_llm_output = await self._call_llm_for_extraction_with_logging(context_prompt)
                print(f"[LLM RAW OUTPUT] {raw_llm_output}")  # Log raw LLM output for debugging
                if llm_result and all(key in llm_result for key in ['monday_status', 'tuesday_status', 'wednesday_status', 'thursday_status', 'friday_status']):
                    # Use LLM result if successful
                    day_statuses.update(llm_result)
                else:
                    # If LLM fails, do not confirm or save, and return an error message
                    return {
                        'data_extracted': False,
                        'extracted_data': {},
                        'extracted_days': [],
                        'needs_confirmation': False,
                        'confirmation_message': 'Sorry, I could not understand your office plans. Please specify the days you plan to be in the office.'
                    }
            except Exception as e:
                print(f"LLM extraction failed, using pattern matching: {e}")
                return {
                    'data_extracted': False,
                    'extracted_data': {},
                    'extracted_days': [],
                    'needs_confirmation': False,
                    'confirmation_message': 'Sorry, I could not process your office plans due to an error. Please try again.'
                }
        
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
        
        """
        Simple WFO Response Processor - Following Basic Principles
        =========================================================
        Extract office days from user response using simple logic
        """

        class WFOResponseProcessor:
            """Simple processor that handles basic WFO responses"""

            async def process_wfo_response(self, user_id: str, message: str, question_context: dict = None):
                """
                Extract WFO data from user message using simple pattern matching only.
                LLM logic must be handled by the bot, not the API.
                """
                message_lower = message.lower()
                day_statuses = {
                    'monday_status': 'home',
                    'tuesday_status': 'home',
                    'wednesday_status': 'home',
                    'thursday_status': 'home',
                    'friday_status': 'home'
                }
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
                return {
                    'data_extracted': True,
                    'extracted_data': processed_data,
                    'extracted_days': office_days,
                    'needs_confirmation': True,
                    'confirmation_message': confirmation_msg
                }
            # LLM extraction method removed. No LLM calls allowed in API.