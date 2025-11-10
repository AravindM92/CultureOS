"""
Universal LLM-First Detection Service
===================================
Replaces ALL hardcoded detection with LLM-based classification.
Handles both Moments and WFO detection without hardcoded patterns.
"""

from typing import Dict, List, Optional, Any
import re
import json

class UniversalMessageDetector:
    """
    LLM-First message classification for ALL modules
    NO hardcoded keywords or patterns - pure LLM intelligence
    """
    
    def __init__(self, groq_client=None):
        self.groq_client = groq_client
        
    async def detect_message_intent(self, message: str, user_context: Dict = None) -> Dict[str, Any]:
        """
        Universal message classification using LLM only
        
        Returns classification for:
        - Moment detection (birthday, anniversary, promotion, etc.)
        - WFO response detection  
        - General conversation
        - Administrative commands
        
        NO hardcoded patterns - pure LLM analysis
        """
        
        classification_prompt = f"""
        Analyze this message and classify its intent. Return JSON only.
        
        Message: "{message}"
        
        Classify into one of these categories:
        1. "moment" - User sharing a celebration, achievement, birthday, anniversary, promotion, etc.
        2. "wfo_response" - User responding about work from office plans/availability
        3. "wfo_proactive" - System should ask about WFO plans (if no data available)
        4. "general" - General conversation
        5. "admin" - Administrative commands
        
        If "moment", extract:
        - moment_type: birthday, work_anniversary, promotion, achievement, new_hire, lwd, other
        - person_name: who is being celebrated
        - moment_date: when (if mentioned)
        - description: what happened
        
        If "wfo_response", extract:
        - days_mentioned: which days user mentioned
        - availability: office/home/hybrid/leave for each day
        - time_period: tomorrow, this_week, next_week, specific_dates
        
        Return JSON format:
        {{
            "intent": "moment|wfo_response|wfo_proactive|general|admin",
            "confidence": 0.0-1.0,
            "extracted_data": {{}},
            "reasoning": "why you classified it this way"
        }}
        """
        
        try:
            # Use LLM for classification
            llm_response = await self._call_llm(classification_prompt)
            
            # Parse LLM response
            classification = self._parse_llm_response(llm_response)
            
            # Add additional context
            classification["original_message"] = message
            classification["user_context"] = user_context
            classification["processing_method"] = "llm_only"
            
            return classification
            
        except Exception as e:
            # Fallback classification if LLM fails
            return {
                "intent": "general",
                "confidence": 0.1,
                "extracted_data": {},
                "reasoning": f"LLM classification failed: {str(e)}",
                "original_message": message,
                "fallback_used": True
            }
    
    async def _call_llm(self, prompt: str) -> str:
        """Call LLM for classification"""
        if not self.groq_client:
            raise Exception("No LLM client available")
            
        messages = [
            {"role": "system", "content": "You are an expert message classifier. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = await self.groq_client.sendChatCompletion(messages)
        return response
    
    def _parse_llm_response(self, llm_response: str) -> Dict[str, Any]:
        """Parse and validate LLM JSON response"""
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if not json_match:
                raise Exception("No JSON found in LLM response")
                
            classification = json.loads(json_match.group())
            
            # Validate required fields
            if "intent" not in classification:
                classification["intent"] = "general"
            if "confidence" not in classification:
                classification["confidence"] = 0.5
            if "extracted_data" not in classification:
                classification["extracted_data"] = {}
                
            return classification
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON from LLM: {str(e)}")
    
    def is_moment_message(self, classification: Dict) -> bool:
        """Check if message is a moment"""
        return classification.get("intent") == "moment" and classification.get("confidence", 0) > 0.6
    
    def is_wfo_response(self, classification: Dict) -> bool:
        """Check if message is WFO response"""
        return classification.get("intent") == "wfo_response" and classification.get("confidence", 0) > 0.6
    
    def needs_wfo_collection(self, classification: Dict) -> bool:
        """Check if should trigger WFO collection"""
        return classification.get("intent") == "wfo_proactive" and classification.get("confidence", 0) > 0.7


class LegacyPatternRemover:
    """
    Helper to identify and remove hardcoded patterns from existing code
    """
    
    @staticmethod
    def get_hardcoded_patterns_to_remove():
        """List of hardcoded patterns that need LLM replacement"""
        return [
            # Moment detection patterns
            "message.includes('birthday')",
            "message.includes('promotion')",
            "message.includes('anniversary')",
            "message.includes('completed')",
            "detectMomentType(message)",
            
            # Date detection patterns  
            "lowerText.includes('tomorrow')",
            "lowerText.includes('yesterday')",
            "dateStr.includes('today')",
            
            # WFO patterns (to avoid in new code)
            "message.includes('office')",
            "message.includes('wfo')",
            "message.includes('work from')",
            
            # Replace ALL of these with LLM calls
        ]
    
    @staticmethod
    def generate_llm_replacement_code():
        """Generate code to replace hardcoded patterns"""
        return '''
        // REPLACE ALL HARDCODED PATTERNS WITH:
        const detector = new UniversalMessageDetector(groqClient);
        const classification = await detector.detect_message_intent(message, userContext);
        
        if (detector.is_moment_message(classification)) {
            // Handle moment
            const momentData = classification.extracted_data;
        } else if (detector.is_wfo_response(classification)) {
            // Handle WFO response  
            const wfoData = classification.extracted_data;
        } else if (detector.needs_wfo_collection(classification)) {
            // Trigger WFO collection
        }
        '''