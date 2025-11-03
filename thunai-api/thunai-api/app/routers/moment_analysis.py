from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel
import re
from datetime import datetime, date

router = APIRouter(prefix="/moment-analysis", tags=["moment-analysis"])

class MomentAnalysisRequest(BaseModel):
    text: str

class MomentAnalysisResponse(BaseModel):
    celebrant_name: Optional[str]
    moment_type: str
    category: str
    celebration_date: Optional[str]
    confidence: float
    extracted_info: Dict

@router.post("/parse", response_model=MomentAnalysisResponse)
async def analyze_moment_text(request: MomentAnalysisRequest):
    """
    Analyze moment text to extract celebrant, type, category, and date
    """
    text = request.text.lower().strip()
    
    # Initialize result
    result = {
        "celebrant_name": None,
        "moment_type": "celebration",
        "category": "celebration", 
        "celebration_date": None,
        "confidence": 0.0,
        "extracted_info": {}
    }
    
    # Extract celebrant name (first capitalized word that's likely a name)
    name_patterns = [
        r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|will|'s|won|received|got|achieved)",
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:birthday|anniversary|joining|leaving)",
        r"(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s"  # Name at start followed by space
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, request.text)
        if match:
            result["celebrant_name"] = match.group(1)
            result["confidence"] += 0.3
            break
    
    # Detect moment type and category
    type_keywords = {
        # WELCOME
        "joining_welcome": ["joining", "new member", "starting", "welcome", "first day"],
        "onboarding_milestone": ["week", "month", "onboarding", "milestone"],
        
        # CELEBRATION
        "birthday": ["birthday", "born", "birth", "bday"],
        "work_anniversary": ["anniversary", "years with", "years at", "work anniversary"],
        "promotion": ["promoted", "promotion", "new role", "advanced"],
        "achievement": ["won", "award", "recognition", "achievement", "accomplished", "excellence"],
        "project_success": ["completed", "achieved", "success", "milestone", "project"],
        
        # FAREWELL
        "lwd": ["last working day", "lwd", "final day", "last day"],
        "farewell": ["leaving", "goodbye", "farewell", "departing"],
        "transfer": ["transferring", "moving to", "transfer", "relocating"]
    }
    
    categories = {
        "joining_welcome": "welcome",
        "onboarding_milestone": "welcome", 
        "birthday": "celebration",
        "work_anniversary": "celebration",
        "promotion": "celebration",
        "achievement": "celebration",
        "project_success": "celebration",
        "lwd": "farewell",
        "farewell": "farewell",
        "transfer": "farewell"
    }
    
    best_match = None
    best_score = 0
    
    for moment_type, keywords in type_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_score:
            best_score = score
            best_match = moment_type
    
    if best_match:
        result["moment_type"] = best_match
        result["category"] = categories[best_match]
        result["confidence"] += 0.4
    
    # Extract date
    date_patterns = [
        r"(?:on|is)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)",
        r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        r"(tomorrow|today|next week|next month)"
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            result["celebration_date"] = match.group(1)
            result["confidence"] += 0.3
            break
    
    # Store extracted info
    result["extracted_info"] = {
        "original_text": request.text,
        "detected_keywords": [kw for kw in type_keywords.get(result["moment_type"], []) if kw in text]
    }
    
    return MomentAnalysisResponse(**result)