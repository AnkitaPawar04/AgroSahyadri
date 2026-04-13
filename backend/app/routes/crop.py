from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database.config import get_db
from ..models.farmer import Prediction
from ..utils.location import get_district_from_coordinates
from ..utils.soil_database import get_soil_data
from ..utils.model_inference import get_model
import requests
import json
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/crop", tags=["crop recommendation"])

class CropRecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    season: str  # Kharif or Rabi
    farmer_id: int
    nitrogen: Optional[float] = 50
    phosphorus: Optional[float] = 50
    potassium: Optional[float] = 50
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ph: Optional[float] = None
    rainfall: Optional[float] = None

class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    confidence: float
    top_crops: list
    district: str
    season: str

@router.post("/predict", response_model=CropRecommendationResponse)
async def predict_crop(request: CropRecommendationRequest, db: Session = Depends(get_db)):
    """
    Predict crop using ML model based on soil and weather data
    """
    
    # Get district from coordinates
    district = get_district_from_coordinates(request.latitude, request.longitude)
    
    # Get soil data for district
    soil_data = get_soil_data(district)
    
    # Get weather data from OpenWeatherMap or use provided data
    weather_data = get_weather_data(request.latitude, request.longitude)
    
    # Use provided values or defaults
    temperature = request.temperature if request.temperature is not None else weather_data.get("temperature", 25)
    humidity = request.humidity if request.humidity is not None else weather_data.get("humidity", 60)
    ph = request.ph if request.ph is not None else soil_data.get("ph", 6.5)
    rainfall = request.rainfall if request.rainfall is not None else weather_data.get("rainfall", 100)
    
    # Get ML model instance
    model = get_model()
    
    # Get prediction from trained model
    prediction_result = model.predict(
        nitrogen=request.nitrogen,
        phosphorus=request.phosphorus,
        potassium=request.potassium,
        temperature=temperature,
        humidity=humidity,
        ph=ph,
        rainfall=rainfall
    )
    
    # Format top crops response
    top_crops_list = [crop["crop"] for crop in prediction_result["top_crops"]]
    
    # Save prediction in database
    try:
        prediction = Prediction(
            farmer_id=request.farmer_id,
            district=district,
            season=request.season,
            recommended_crop=prediction_result["recommended_crop"],
            confidence=prediction_result["confidence"],
            top_crops=json.dumps(top_crops_list)
        )
        db.add(prediction)
        db.commit()
    except Exception as e:
        print(f"Warning: Could not save prediction to DB: {e}")
    
    return {
        "recommended_crop": prediction_result["recommended_crop"],
        "confidence": prediction_result["confidence"],
        "top_crops": top_crops_list,
        "district": district,
        "season": request.season
    }

def get_weather_data(latitude: float, longitude: float) -> dict:
    """Fetch weather data from OpenWeatherMap API"""
    api_key = "your_openweathermap_api_key"
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "temperature": data.get("main", {}).get("temp", 25),
                "humidity": data.get("main", {}).get("humidity", 60),
                "rainfall": data.get("rain", {}).get("1h", 0)
            }
    except:
        pass
    
    return {
        "temperature": 25,
        "humidity": 60,
        "rainfall": 0
    }

@router.get("/supported-crops")
async def get_supported_crops():
    """Get list of all supported crops in the model"""
    model = get_model()
    crops = model.get_supported_crops()
    return {
        "total_crops": len(crops),
        "crops": crops
    }

@router.get("/district/{district}")
async def get_district_crops(district: str):
    """Get top crops for a specific district using trained model"""
    
    # Get soil data for the district
    soil_data = get_soil_data(district)
    
    # Get the trained model
    model = get_model()
    
    # Predict for Kharif season (high rainfall, high humidity)
    kharif_prediction = model.predict(
        nitrogen=soil_data.get("nitrogen", 130),
        phosphorus=soil_data.get("phosphorus", 40),
        potassium=soil_data.get("potassium", 290),
        temperature=25,  # Average temperature during monsoon
        humidity=80,     # High humidity during monsoon
        ph=soil_data.get("ph", 7.2),
        rainfall=800     # High rainfall
    )
    
    # Predict for Rabi season (low rainfall, low humidity)
    rabi_prediction = model.predict(
        nitrogen=soil_data.get("nitrogen", 130),
        phosphorus=soil_data.get("phosphorus", 40),
        potassium=soil_data.get("potassium", 290),
        temperature=20,  # Cooler temperature during winter
        humidity=40,     # Low humidity during winter
        ph=soil_data.get("ph", 7.2),
        rainfall=50      # Low rainfall
    )
    
    # Extract top 3 crops for each season
    kharif_crops = [crop["crop"] for crop in kharif_prediction["top_crops"][:3]]
    rabi_crops = [crop["crop"] for crop in rabi_prediction["top_crops"][:3]]
    
    return {
        "district": district,
        "kharif_crops": kharif_crops,
        "rabi_crops": rabi_crops,
        "kharif_top_crop": kharif_prediction["recommended_crop"],
        "rabi_top_crop": rabi_prediction["recommended_crop"],
        "soil_data": soil_data,
        "prediction_count": 142,
        "farmer_count": 35
    }
