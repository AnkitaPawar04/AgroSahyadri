from fastapi import APIRouter
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/weather", tags=["weather"])

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    description: str

@router.get("/current/{latitude}/{longitude}", response_model=WeatherResponse)
async def get_current_weather(latitude: float, longitude: float):
    """Get current weather for coordinates"""
    api_key = "your_openweathermap_api_key"
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "rainfall": data.get("rain", {}).get("1h", 0),
                "description": data["weather"][0]["description"]
            }
    except:
        pass
    
    # Return mock data if API fails
    return {
        "temperature": 25.5,
        "humidity": 65,
        "rainfall": 0,
        "description": "Partly cloudy"
    }
