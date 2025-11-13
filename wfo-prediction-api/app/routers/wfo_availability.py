from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.services.wfo_availability_service import WFOAvailabilityService
from app.core.config import settings

router = APIRouter(prefix="/availability", tags=["availability"])
wfo_service = WFOAvailabilityService()

@router.get("/health")
async def availability_health():
    """Health check for availability endpoints"""
    return {"status": "healthy", "module": "wfo_availability"}

@router.get("/check/{user_id}")
async def check_wfo_data_needed(user_id: str, week_start_date: str = "2025-11-11", collection_type: str = "weekly"):
    """
    PRIMARY BOT TRIGGER ENDPOINT
    Bot calls this first to check if WFO collection is needed for user
    """
    try:
        result = await wfo_service.check_data_needed(user_id, week_start_date)
        
        # Add additional context for bot interaction based on collection type
        if result["collection_needed"]:
            # Get prompts from config (fallback to weekly if collection_type not found)
            prompt_config = settings.wfo_prompts.get(collection_type, settings.wfo_prompts["weekly"])
            
            result.update({
                "message_template": prompt_config["message_template"],
                "llm_instruction": prompt_config["llm_instruction"],
                "collection_type": collection_type
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking WFO data: {str(e)}")

@router.get("/should-ask/{user_id}")
async def should_ask_user(user_id: str, type: str = "daily"):
    """Check if user should be asked again (smart stopping logic)"""
    # For now, return that we should ask (implement smart logic later)
    return {
        "user_id": user_id,
        "should_ask": True,
        "interaction_type": type,
        "reason": "Basic implementation - always ask"
    }

@router.post("/process")
async def process_wfo_response(request_data: dict):
    """LLM-powered: Process any WFO response from user"""
    from app.services.wfo_llm_processor import WFOResponseProcessor
    
    processor = WFOResponseProcessor()
    user_id = request_data.get('user_id')
    message = request_data.get('message')
    context = request_data.get('context', {})
    
    if not user_id or not message:
        raise HTTPException(status_code=400, detail="user_id and message are required")
    
    # Process the user's response using LLM
    result = await processor.process_wfo_response(user_id, message, context)
    
    return result

@router.post("/save")
async def save_wfo_schedule(request_data: dict):
    """Save WFO schedule data after confirmation"""
    try:
        # Extract required fields
        user_id = request_data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Use the schedule_data or default week
        schedule_data = request_data.get("schedule_data", {})
        week_start_date = schedule_data.get("week_start_date", "2025-11-11")
        
        # Build WFO data with proper schema fields
        wfo_data = {
            "user_id": user_id,
            "week_start_date": week_start_date,
            "monday_status": schedule_data.get("monday_status"),
            "tuesday_status": schedule_data.get("tuesday_status"),
            "wednesday_status": schedule_data.get("wednesday_status"),
            "thursday_status": schedule_data.get("thursday_status"),
            "friday_status": schedule_data.get("friday_status"),
            "collection_method": schedule_data.get("collection_method", "daily")
        }
        
        # Calculate office days count
        office_days = [wfo_data[f"{day}_status"] for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]]
        office_days_count = sum(1 for status in office_days if status == "office")
        wfo_data["office_days_count"] = office_days_count
        wfo_data["is_compliant"] = office_days_count >= 3
        
        # Save to database
        result = await wfo_service.create_or_update_availability(wfo_data)
        
        return {
            "success": True,
            "user_id": user_id,
            "office_days_count": office_days_count,
            "is_compliant": office_days_count >= 3,
            "message": "WFO schedule saved successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving WFO schedule: {str(e)}")

@router.post("/log-attempt")
async def log_collection_attempt(request_data: dict):
    """Log collection attempt for smart stopping logic"""
    # Basic implementation - log attempt
    return {
        "success": True,
        "logged": True,
        "user_id": request_data.get("user_id")
    }

@router.post("/availability/collect")
async def collect_wfo_data():
    """Collect WFO data from user interaction"""
    # TODO: Implement WFO data collection
    return {"message": "WFO collection endpoint - to be implemented"}

@router.get("/user/{user_id}")
async def get_user_availability(user_id: str, week_start_date: str = "2025-11-11"):
    """Get WFO availability for specific user"""
    try:
        if week_start_date:
            # Get specific week
            result = await wfo_service.get_by_user_and_week(user_id, week_start_date)
            return result if result else {"message": f"No WFO data found for user {user_id} for week {week_start_date}"}
        else:
            # Get all weeks for user
            results = await wfo_service.get_by_user_id(user_id)
            return {"user_id": user_id, "availability_records": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user availability: {str(e)}")

@router.put("/user/{user_id}")
async def update_user_availability(user_id: str):
    """Update WFO availability for specific user"""
    # TODO: Implement user availability update
    return {"message": f"Update availability for user {user_id} - to be implemented"}

