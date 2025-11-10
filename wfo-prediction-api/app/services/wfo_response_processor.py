"""
LLM Response Processor for WFO Data
==================================
Processes ANY user response to extract WFO availability data.
Flexible architecture - user can provide any amount of data regardless of question asked.
"""

from typing import Dict, List, Optional, Any
import re
from datetime import date, datetime, timedelta

class WFOResponseProcessor:
    """
    LLM-First processor for WFO responses
    Handles ANY user response regardless of what was asked
    """
    
    def __init__(self):
        self.day_patterns = {
            'monday': ['monday', 'mon', 'mondays'],
            'tuesday': ['tuesday', 'tue', 'tues', 'tuesdays'], 
            'wednesday': ['wednesday', 'wed', 'wednesdays'],
            'thursday': ['thursday', 'thu', 'thur', 'thursdays'],
            'friday': ['friday', 'fri', 'fridays']
        }
        
        self.status_patterns = {
            'office': ['office', 'in office', 'coming in', 'be in', 'work from office', 'wfo'],
            'home': ['home', 'wfh', 'work from home', 'remote', 'not coming'],
            'hybrid': ['hybrid', 'half day', 'morning office', 'afternoon home'],
            'leave': ['leave', 'off', 'vacation', 'holiday', 'absent']
        }
    
    async def process_wfo_response(self, user_id: str, message: str, context: dict = None) -> Dict[str, Any]:
        """
        Process ANY user response to extract WFO data
        
        Examples of what users might say:
        - "Yes" (to tomorrow question) -> Tomorrow: office
        - "Monday to Wednesday" -> Mon, Tue, Wed: office  
        - "I'll be in Mon, Wed, Fri and WFH Tue, Thu" -> Full week data
        - "All week in office" -> Mon-Fri: office
        - "Not tomorrow but rest of week" -> Multiple days
        
        Args:
            user_id: User identifier
            message: What user actually said
            context: Conversation context (optional)
            
        Returns:
            Flexible data structure with whatever user provided
        """
        
        # Simple pattern matching implementation for testing
        message_lower = message.lower()
        
        # Initialize day statuses
        day_statuses = {
            'monday_status': None,
            'tuesday_status': None,
            'wednesday_status': None,
            'thursday_status': None,
            'friday_status': None
        }
        
        # Handle range patterns like "Monday to Wednesday"
        if 'to' in message_lower:
            # Extract day ranges
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            day_short = ['mon', 'tue', 'wed', 'thu', 'fri']
            
            # Find start and end days
            start_day = None
            end_day = None
            
            for i, day in enumerate(days):
                if day in message_lower or day_short[i] in message_lower:
                    if start_day is None:
                        start_day = i
                    else:
                        end_day = i
            
            # If we found a range, mark all days in between as office
            if start_day is not None and end_day is not None:
                day_keys = ['monday_status', 'tuesday_status', 'wednesday_status', 'thursday_status', 'friday_status']
                for i in range(start_day, end_day + 1):
                    day_statuses[day_keys[i]] = 'office'
        
        # Individual day detection
        if not any(day_statuses.values()):  # Only if no range was found
            if 'monday' in message_lower or 'mon' in message_lower:
                day_statuses['monday_status'] = 'office'
            if 'tuesday' in message_lower or 'tue' in message_lower:
                day_statuses['tuesday_status'] = 'office'
            if 'wednesday' in message_lower or 'wed' in message_lower:
                day_statuses['wednesday_status'] = 'office'
            if 'thursday' in message_lower or 'thu' in message_lower:
                day_statuses['thursday_status'] = 'office'
            if 'friday' in message_lower or 'fri' in message_lower:
                day_statuses['friday_status'] = 'office'
        
        # Count office days
        office_count = sum(1 for status in day_statuses.values() if status == 'office')
        
        # Calculate derived fields
        processed_data = {
            **day_statuses,
            'office_days_count': office_count,
            'is_compliant': office_count >= 3,
            'collection_method': 'daily'
        }
        
        # Create confirmation message
        office_days = []
        if day_statuses['monday_status'] == 'office':
            office_days.append('Monday')
        if day_statuses['tuesday_status'] == 'office':
            office_days.append('Tuesday')
        if day_statuses['wednesday_status'] == 'office':
            office_days.append('Wednesday')
        if day_statuses['thursday_status'] == 'office':
            office_days.append('Thursday')
        if day_statuses['friday_status'] == 'office':
            office_days.append('Friday')
        
        confirmation_msg = f"Got it! You'll be in the office on {', '.join(office_days)}. That's {office_count} days. Should I save this?"
        
        return {
            'data_extracted': True,
            'extracted_data': processed_data,
            'extracted_days': office_days,
            'needs_confirmation': True,
            'confirmation_message': confirmation_msg
        }
    
    def _extract_days_mentioned(self, response: str) -> List[str]:
        """Extract any days mentioned in response"""
        days_found = []
        
        for day, patterns in self.day_patterns.items():
            if any(pattern in response for pattern in patterns):
                days_found.append(day)
                
        # Handle ranges like "Monday to Wednesday"
        range_matches = re.findall(r'(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri)\s*(?:to|-)\s*(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri)', response)
        if range_matches:
            days_found.extend(self._expand_day_range(range_matches[0]))
        
        return days_found
    
    def _extract_status_for_day(self, response: str, day: str) -> str:
        """Extract office/home/hybrid/leave status for specific day"""
        
        # Look for status keywords near the day
        day_patterns = self.day_patterns[day]
        
        for status, keywords in self.status_patterns.items():
            for keyword in keywords:
                # Check if status keyword appears near day mention
                if keyword in response:
                    return status
        
        # Default to office if mentioned positively
        positive_indicators = ['yes', 'coming', 'will be', 'planning to']
        if any(indicator in response for indicator in positive_indicators):
            return 'office'
            
        # Default to home if mentioned negatively  
        negative_indicators = ['no', 'not', 'won\'t', 'cannot']
        if any(indicator in response for indicator in negative_indicators):
            return 'home'
            
        return 'office'  # Default assumption
    
    def _infer_from_context(self, response: str, question_context: str) -> Dict[str, str]:
        """Infer WFO data when no specific days mentioned"""
        
        # Simple yes/no responses
        if any(word in response for word in ['yes', 'yeah', 'sure', 'definitely']):
            if 'tomorrow' in question_context.lower():
                return {'tomorrow': 'office'}
            elif 'week' in question_context.lower():
                return self._generate_full_week('office')
                
        if any(word in response for word in ['no', 'nope', 'not']):
            if 'tomorrow' in question_context.lower():
                return {'tomorrow': 'home'}
                
        # All week responses
        if any(phrase in response for phrase in ['all week', 'whole week', 'entire week']):
            status = 'office' if any(word in response for word in ['office', 'coming', 'in']) else 'home'
            return self._generate_full_week(status)
        
        return {}
    
    def _handle_special_cases(self, response: str, extracted_data: Dict) -> Dict[str, str]:
        """Handle special response patterns"""
        
        # "Rest of the week" patterns
        if 'rest of' in response or 'remaining' in response:
            # Add remaining days as office (or inferred status)
            all_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            current_days = set(extracted_data.keys())
            
            status = 'office'  # Default for "rest of week"
            for day in all_days:
                if day not in current_days:
                    extracted_data[day] = status
        
        # "Except" patterns
        if 'except' in response or 'but not' in response:
            # This needs more sophisticated parsing
            pass
            
        return extracted_data
    
    def _generate_full_week(self, status: str) -> Dict[str, str]:
        """Generate full week with same status"""
        return {
            'monday': status,
            'tuesday': status, 
            'wednesday': status,
            'thursday': status,
            'friday': status
        }
    
    def _expand_day_range(self, day_range: tuple) -> List[str]:
        """Expand day range like Monday-Wednesday to [monday, tuesday, wednesday]"""
        days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        
        start_day = self._normalize_day_name(day_range[0])
        end_day = self._normalize_day_name(day_range[1])
        
        start_idx = days_order.index(start_day)
        end_idx = days_order.index(end_day)
        
        return days_order[start_idx:end_idx + 1]
    
    def _normalize_day_name(self, day: str) -> str:
        """Convert any day variant to standard form"""
        day_lower = day.lower()
        
        for standard_day, variants in self.day_patterns.items():
            if day_lower in variants or day_lower == standard_day:
                return standard_day
                
        return day_lower
    
    def _get_processing_notes(self, response: str, extracted_data: Dict) -> List[str]:
        """Generate notes about processing decisions"""
        notes = []
        
        if not extracted_data:
            notes.append("No clear WFO data extracted - may need clarification")
            
        if len(extracted_data) > 3:
            notes.append("User provided extensive week data")
            
        if 'tomorrow' in extracted_data:
            notes.append("Response included tomorrow's plan")
            
        return notes
    
    def _calculate_confidence(self, response: str, extracted_data: Dict) -> float:
        """Calculate confidence level of extraction"""
        
        if not extracted_data:
            return 0.0
            
        # High confidence indicators
        high_confidence_patterns = ['definitely', 'sure', 'yes', 'specific days mentioned']
        confidence = 0.5  # Base confidence
        
        if any(pattern in response for pattern in high_confidence_patterns):
            confidence += 0.3
            
        if len(extracted_data) >= 1:
            confidence += 0.2
            
        return min(confidence, 1.0)