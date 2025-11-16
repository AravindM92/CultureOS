import requests
from typing import Dict, Any

class APIClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        
    def submit_wfo_plan(self, wfo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit WFO plan to API"""
        try:
            response = requests.post(
                f"{self.base_url}/wfo/submit",
                json=wfo_data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}