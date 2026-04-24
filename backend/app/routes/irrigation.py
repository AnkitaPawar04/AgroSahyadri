#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Irrigation prediction routes
POST /irrigation/predict - Get irrigation recommendation
GET /irrigation/history/{farmer_id} - Get prediction history
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from ..database.config import get_db
from ..models.farmer import Farmer, IrrigationPrediction
from ..utils.irrigation_model import get_irrigation_model
from ..utils.irrigation_utils import (
    validate_irrigation_input,
    map_prediction_to_recommendation,
    generate_irrigation_advice,
    determine_district_from_coordinates
)

router = APIRouter(prefix="/irrigation", tags=["irrigation"])


class IrrigationPredictRequest(BaseModel):
    farmer_id: Optional[int] = None
    latitude: float = Field(..., ge=-90, le=90, description="Latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude")
    soil_moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage")
    temperature_c: float = Field(..., ge=10, le=45, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    rainfall_mm: float = Field(..., ge=0, description="Recent rainfall in mm")
    crop_type: str = Field(..., description="Crop type")
    soil_type: str = Field(..., description="Soil type")
    crop_growth_stage: str = Field(..., description="Growth stage")
    previous_irrigation_mm: float = Field(default=0, ge=0, description="Previous irrigation amount")
    soil_ph: float = Field(..., ge=4.5, le=8.5, description="Soil pH")
    organic_carbon: float = Field(..., ge=0.1, le=3, description="Organic carbon percentage")
    electrical_conductivity: float = Field(..., ge=0.1, le=2, description="Electrical conductivity dS/m")
    season: str = Field(..., description="Season")
    irrigation_type: str = Field(..., description="Irrigation type")
    water_source: str = Field(..., description="Water source")
    sunlight_hours: float = Field(..., ge=0, le=14, description="Daily sunlight hours")
    wind_speed_kmh: float = Field(..., ge=0, le=30, description="Wind speed in km/h")
    field_area_hectare: float = Field(..., ge=0.1, le=10, description="Field area in hectares")
    mulching_used: str = Field(..., description="Mulching used (Yes/No)")
    region: str = Field(default="Western", description="Maharashtra region")


class IrrigationPredictResponse(BaseModel):
    prediction: str
    confidence: float
    irrigate_action: str
    water_amount_liters_per_m2: str
    advice: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class IrrigationHistoryResponse(BaseModel):
    id: int
    farmer_id: int
    district: str
    crop_type: str
    soil_type: str
    soil_moisture: float
    temperature_c: float
    humidity: float
    rainfall_mm: float
    crop_growth_stage: str
    previous_irrigation_mm: float
    prediction_class: str
    confidence: float
    irrigate_action: str
    water_amount_liters_per_m2: str
    advice: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


@router.post("/predict", response_model=IrrigationPredictResponse)
async def predict_irrigation(
    request: IrrigationPredictRequest,
    db: Session = Depends(get_db)
):
    """
    Get irrigation recommendation based on environmental and agricultural parameters
    
    Returns:
    - prediction: Low/Medium/High irrigation need
    - confidence: Model confidence (0-100%)
    - irrigate_action: Yes/Moderate/No irrigation action
    - water_amount: Recommended water amount (L/m²)
    - advice: Agricultural advice based on conditions
    - timestamp: Prediction timestamp
    """
    
    try:
        # Validate input
        try:
            validated = validate_irrigation_input(request.dict())
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        
        # Determine district from coordinates
        district = determine_district_from_coordinates(request.latitude, request.longitude)
        
        # Get ML model
        model = get_irrigation_model()
        
        # Prepare features for prediction
        features = {
            'soil_moisture': request.soil_moisture,
            'temperature_c': request.temperature_c,
            'humidity': request.humidity,
            'rainfall_mm': request.rainfall_mm,
            'crop_type': request.crop_type,
            'soil_type': request.soil_type,
            'crop_growth_stage': request.crop_growth_stage,
            'previous_irrigation_mm': request.previous_irrigation_mm,
            'soil_ph': request.soil_ph,
            'organic_carbon': request.organic_carbon,
            'electrical_conductivity': request.electrical_conductivity,
            'season': request.season,
            'irrigation_type': request.irrigation_type,
            'water_source': request.water_source,
            'sunlight_hours': request.sunlight_hours,
            'wind_speed_kmh': request.wind_speed_kmh,
            'field_area_hectare': request.field_area_hectare,
            'mulching_used': request.mulching_used,
            'region': request.region
        }
        
        # Get prediction from model
        prediction_result = model.predict(features)
        
        # Map to recommendation
        recommendation = map_prediction_to_recommendation(
            prediction_result['prediction'],
            request.soil_moisture,
            request.rainfall_mm,
            request.crop_type,
            request.crop_growth_stage
        )
        
        # Generate advice
        advice = generate_irrigation_advice(
            prediction_result['prediction'],
            request.soil_moisture,
            request.rainfall_mm,
            request.crop_type,
            request.crop_growth_stage,
            request.temperature_c,
            request.humidity
        )
        
        now = datetime.utcnow()
        
        # Save to database if farmer_id is provided
        if request.farmer_id:
            try:
                farmer = db.query(Farmer).filter(Farmer.id == request.farmer_id).first()
                if farmer:
                    prediction_record = IrrigationPrediction(
                        farmer_id=request.farmer_id,
                        district=district,
                        # Soil parameters
                        soil_type=request.soil_type,
                        soil_ph=request.soil_ph,
                        soil_moisture=request.soil_moisture,
                        organic_carbon=request.organic_carbon,
                        electrical_conductivity=request.electrical_conductivity,
                        # Weather parameters
                        temperature_c=request.temperature_c,
                        humidity=request.humidity,
                        rainfall_mm=request.rainfall_mm,
                        sunlight_hours=request.sunlight_hours,
                        wind_speed_kmh=request.wind_speed_kmh,
                        # Crop and farm parameters
                        crop_type=request.crop_type,
                        crop_growth_stage=request.crop_growth_stage,
                        season=request.season,
                        field_area_hectare=request.field_area_hectare,
                        previous_irrigation_mm=request.previous_irrigation_mm,
                        # Irrigation management
                        irrigation_type=request.irrigation_type,
                        water_source=request.water_source,
                        mulching_used=request.mulching_used,
                        # Prediction results
                        prediction_class=prediction_result['prediction'],
                        confidence=prediction_result['confidence'],
                        irrigate_action=recommendation['action'],
                        water_amount_liters_per_m2=recommendation['water_amount'],
                        advice=advice,
                        latitude=request.latitude,
                        longitude=request.longitude,
                        timestamp=now
                    )
                    db.add(prediction_record)
                    db.commit()
                    print(f"✓ Saved irrigation prediction for farmer {request.farmer_id}")
            except Exception as e:
                print(f"⚠️  Database save warning: {e}")
                # Continue without saving if DB fails - don't fail the prediction
                db.rollback()
        
        return IrrigationPredictResponse(
            prediction=prediction_result['prediction'],
            confidence=prediction_result['confidence'],
            irrigate_action=recommendation['action'],
            water_amount_liters_per_m2=recommendation['water_amount'],
            advice=advice,
            timestamp=now
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.get("/history/{farmer_id}", response_model=List[IrrigationHistoryResponse])
async def get_irrigation_history(
    farmer_id: int,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get irrigation prediction history for a farmer
    
    Args:
        farmer_id: Farmer ID
        limit: Maximum number of records to return (default: 10, max: 100)
    
    Returns:
        List of irrigation predictions ordered by timestamp (newest first)
    """
    try:
        # Check if farmer exists
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        predictions = db.query(IrrigationPrediction)\
            .filter(IrrigationPrediction.farmer_id == farmer_id)\
            .order_by(IrrigationPrediction.timestamp.desc())\
            .limit(limit)\
            .all()
        
        return predictions
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ History fetch error: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/stats/{farmer_id}")
async def get_irrigation_stats(
    farmer_id: int,
    db: Session = Depends(get_db)
):
    """
    Get irrigation prediction statistics for a farmer
    
    Returns statistics like average confidence, prediction counts, etc.
    """
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        predictions = db.query(IrrigationPrediction)\
            .filter(IrrigationPrediction.farmer_id == farmer_id)\
            .all()
        
        if not predictions:
            return {
                "farmer_id": farmer_id,
                "total_predictions": 0,
                "average_confidence": 0,
                "prediction_counts": {"Low": 0, "Medium": 0, "High": 0}
            }
        
        # Calculate stats
        confidence_sum = sum(p.confidence for p in predictions)
        avg_confidence = confidence_sum / len(predictions)
        
        prediction_counts = {
            "Low": len([p for p in predictions if p.prediction_class == "Low"]),
            "Medium": len([p for p in predictions if p.prediction_class == "Medium"]),
            "High": len([p for p in predictions if p.prediction_class == "High"])
        }
        
        return {
            "farmer_id": farmer_id,
            "total_predictions": len(predictions),
            "average_confidence": round(avg_confidence, 2),
            "prediction_counts": prediction_counts,
            "latest_prediction": {
                "timestamp": predictions[0].timestamp,
                "prediction": predictions[0].prediction_class,
                "crop": predictions[0].crop_type
            } if predictions else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Stats calculation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
