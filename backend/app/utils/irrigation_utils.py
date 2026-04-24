#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Irrigation prediction utilities
Validation, recommendation mapping, and advice generation
"""

from typing import Dict, Any


def validate_irrigation_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate irrigation prediction input
    
    Args:
        data: Dictionary with irrigation parameters
    
    Returns:
        Validated data dictionary
    
    Raises:
        ValueError: If validation fails
    """
    
    # Required fields
    required = [
        'soil_moisture', 'temperature_c', 'humidity', 'rainfall_mm',
        'crop_type', 'soil_type', 'crop_growth_stage', 'previous_irrigation_mm',
        'latitude', 'longitude', 'soil_ph', 'organic_carbon', 'electrical_conductivity',
        'season', 'irrigation_type', 'water_source', 'sunlight_hours',
        'wind_speed_kmh', 'field_area_hectare', 'mulching_used'
    ]
    
    for field in required:
        if field not in data or data[field] is None:
            raise ValueError(f"Missing required field: {field}")
    
    # Range validation for numeric fields
    ranges = {
        'soil_moisture': (0, 100, 'Soil moisture must be 0-100%'),
        'temperature_c': (10, 45, 'Temperature must be 10-45°C'),
        'humidity': (0, 100, 'Humidity must be 0-100%'),
        'rainfall_mm': (0, 500, 'Rainfall must be 0-500mm'),
        'previous_irrigation_mm': (0, 200, 'Previous irrigation must be 0-200mm'),
        'latitude': (-90, 90, 'Invalid latitude'),
        'longitude': (-180, 180, 'Invalid longitude'),
        'soil_ph': (4.5, 8.5, 'Soil pH must be 4.5-8.5'),
        'organic_carbon': (0.1, 3, 'Organic carbon must be 0.1-3%'),
        'electrical_conductivity': (0.1, 2, 'EC must be 0.1-2 dS/m'),
        'sunlight_hours': (0, 14, 'Sunlight hours must be 0-14'),
        'wind_speed_kmh': (0, 30, 'Wind speed must be 0-30 km/h'),
        'field_area_hectare': (0.1, 10, 'Field area must be 0.1-10 hectares'),
    }
    
    for field, (min_val, max_val, message) in ranges.items():
        try:
            value = float(data[field])
            if not (min_val <= value <= max_val):
                raise ValueError(message)
        except ValueError as e:
            raise ValueError(f"{field}: {str(e)}")
    
    # Crop type validation
    valid_crops = [
        'Sugarcane', 'Maize', 'Cotton', 'Wheat', 'Rice',
        'Jowar', 'Pulse', 'Groundnut', 'Soybean', 'Potato'
    ]
    if data['crop_type'] not in valid_crops:
        raise ValueError(
            f"Invalid crop type '{data['crop_type']}'. "
            f"Valid options: {', '.join(valid_crops)}"
        )
    
    # Soil type validation
    valid_soils = ['Sandy', 'Loamy', 'Clay', 'Silt', 'Peaty']
    if data['soil_type'] not in valid_soils:
        raise ValueError(
            f"Invalid soil type '{data['soil_type']}'. "
            f"Valid options: {', '.join(valid_soils)}"
        )
    
    # Growth stage validation
    valid_stages = [
        'Germination', 'Vegetative', 'Flowering',
        'Fruiting/Grain Development', 'Maturity', 'Sowing', 'Harvest'
    ]
    if data['crop_growth_stage'] not in valid_stages:
        raise ValueError(
            f"Invalid growth stage '{data['crop_growth_stage']}'. "
            f"Valid options: {', '.join(valid_stages)}"
        )
    
    # Season validation
    valid_seasons = ['Kharif', 'Rabi', 'Zaid']
    if data['season'] not in valid_seasons:
        raise ValueError(
            f"Invalid season '{data['season']}'. "
            f"Valid options: {', '.join(valid_seasons)}"
        )
    
    # Irrigation type validation
    valid_irrigation_types = ['Canal', 'Drip', 'Rainfed', 'Sprinkler']
    if data['irrigation_type'] not in valid_irrigation_types:
        raise ValueError(
            f"Invalid irrigation type '{data['irrigation_type']}'. "
            f"Valid options: {', '.join(valid_irrigation_types)}"
        )
    
    # Water source validation
    valid_water_sources = ['Groundwater', 'Rainwater', 'Reservoir', 'River']
    if data['water_source'] not in valid_water_sources:
        raise ValueError(
            f"Invalid water source '{data['water_source']}'. "
            f"Valid options: {', '.join(valid_water_sources)}"
        )
    
    # Mulching validation
    valid_mulching = ['Yes', 'No']
    if data['mulching_used'] not in valid_mulching:
        raise ValueError(
            f"Invalid mulching value '{data['mulching_used']}'. "
            f"Valid options: {', '.join(valid_mulching)}"
        )
    
    return data


def map_prediction_to_recommendation(
    prediction: str,
    soil_moisture: float,
    rainfall_mm: float,
    crop_type: str,
    crop_growth_stage: str
) -> Dict[str, str]:
    """
    Map model prediction to actionable recommendation
    
    Args:
        prediction: 'Low', 'Medium', or 'High'
        soil_moisture: Current soil moisture percentage
        rainfall_mm: Recent rainfall in mm
        crop_type: Type of crop
        crop_growth_stage: Current growth stage
    
    Returns:
        Dict with 'action' and 'water_amount' keys
    """
    
    # Base water requirement by crop growth stage (L/m²)
    water_requirements = {
        'Germination': (15, 25),
        'Sowing': (20, 30),
        'Vegetative': (25, 35),
        'Flowering': (30, 45),
        'Fruiting/Grain Development': (35, 50),
        'Harvest': (5, 15),
        'Maturity': (10, 20)
    }
    
    base_water = water_requirements.get(crop_growth_stage, (20, 35))
    
    # Adjust for soil moisture
    adjustment_factor = 1.0
    if soil_moisture > 70:
        adjustment_factor = 0.5  # High moisture = less water
    elif soil_moisture < 30:
        adjustment_factor = 1.5  # Low moisture = more water
    
    # Adjust for recent rainfall
    if rainfall_mm > 100:
        adjustment_factor *= 0.6  # Heavy rain = less irrigation
    elif rainfall_mm > 50:
        adjustment_factor *= 0.8  # Moderate rain = reduce
    
    adjusted_water = (
        int(base_water[0] * adjustment_factor),
        int(base_water[1] * adjustment_factor)
    )
    
    # Map prediction to irrigation action
    prediction_to_action = {
        'Low': 'No',
        'Medium': 'Moderate',
        'High': 'Yes'
    }
    
    return {
        'action': prediction_to_action.get(prediction, 'Moderate'),
        'water_amount': f"{adjusted_water[0]}-{adjusted_water[1]} L/m²"
    }


def generate_irrigation_advice(
    prediction: str,
    soil_moisture: float,
    rainfall_mm: float,
    crop_type: str,
    crop_growth_stage: str,
    temperature_c: float = 25,
    humidity: float = 60
) -> str:
    """
    Generate agricultural advice based on prediction and conditions
    
    Args:
        prediction: Model prediction (Low/Medium/High)
        soil_moisture: Current soil moisture %
        rainfall_mm: Recent rainfall mm
        crop_type: Type of crop
        crop_growth_stage: Current growth stage
        temperature_c: Temperature in Celsius
        humidity: Humidity percentage
    
    Returns:
        Agricultural advice string
    """
    
    advice_parts = []
    
    # Base prediction advice
    if prediction == 'High':
        advice_parts.append(f"🚨 URGENT: Your {crop_type} needs immediate irrigation.")
        advice_parts.append("Soil moisture is critically low and will impact crop yield.")
    elif prediction == 'Medium':
        advice_parts.append(f"⚠️ MODERATE: {crop_type} requires irrigation soon.")
        advice_parts.append("Plan irrigation within the next 2-3 days for optimal growth.")
    else:  # Low
        advice_parts.append(f"✅ GOOD: Your {crop_type} has sufficient moisture.")
        advice_parts.append("No immediate irrigation needed - monitor daily.")
    
    # Growth stage specific advice
    if crop_growth_stage == 'Flowering':
        advice_parts.append(
            f"During flowering, consistent water availability is critical to prevent flower drop. "
            f"Avoid water stress at this stage."
        )
    elif crop_growth_stage == 'Fruiting/Grain Development':
        advice_parts.append(
            f"Grain development requires steady water supply. "
            f"Irregular irrigation can significantly reduce yield and quality."
        )
    elif crop_growth_stage == 'Vegetative':
        advice_parts.append(
            f"Vegetative stage requires consistent moisture for plant growth. "
            f"Ensure regular irrigation schedule."
        )
    elif crop_growth_stage == 'Germination' or crop_growth_stage == 'Sowing':
        advice_parts.append(
            f"Seedlings are highly sensitive to water stress. "
            f"Keep soil consistently moist but ensure good drainage to prevent waterlogging."
        )
    
    # Rainfall consideration
    if rainfall_mm > 150:
        advice_parts.append(
            f"Heavy rainfall ({rainfall_mm}mm) detected recently. "
            f"Monitor soil drainage and check for waterlogging. Hold irrigation if soil is saturated."
        )
    elif rainfall_mm > 75:
        advice_parts.append(
            f"Moderate rainfall ({rainfall_mm}mm) received. "
            f"This will help reduce irrigation needs. Monitor and adjust irrigation frequency."
        )
    elif rainfall_mm > 25:
        advice_parts.append(
            f"Light rainfall ({rainfall_mm}mm) recorded. "
            f"This provides some moisture but may not be sufficient for full irrigation needs."
        )
    else:
        advice_parts.append(
            f"No recent rainfall recorded. Ensure timely irrigation to prevent water stress."
        )
    
    # Temperature consideration
    if temperature_c > 35:
        advice_parts.append(
            f"High temperature ({temperature_c}°C) increases evaporation rates. "
            f"Water more frequently and consider mulching to conserve soil moisture."
        )
    elif temperature_c < 15:
        advice_parts.append(
            f"Cool temperature ({temperature_c}°C) reduces evaporation. "
            f"Adjust irrigation frequency accordingly to avoid overwatering."
        )
    
    # Soil moisture specific
    if soil_moisture < 20:
        advice_parts.append(
            f"Soil is very dry ({soil_moisture}%). "
            f"Apply water immediately if decision is Yes. Consider drip irrigation for efficiency."
        )
    elif soil_moisture > 80:
        advice_parts.append(
            f"Soil is very wet ({soil_moisture}%). "
            f"Ensure proper drainage. Overwatering can cause root diseases."
        )
    
    # Combine all advice
    full_advice = " ".join(advice_parts)
    
    return full_advice.strip()


def determine_district_from_coordinates(latitude: float, longitude: float) -> str:
    """
    Determine Maharashtra district from latitude/longitude
    
    Args:
        latitude: Geographic latitude
        longitude: Geographic longitude
    
    Returns:
        District name
    """
    
    # Maharashtra districts with approximate center coordinates
    districts = {
        'Pune': (18.516, 73.856),
        'Satara': (17.665, 73.912),
        'Kolhapur': (16.702, 73.735),
        'Solapur': (17.656, 75.905),
        'Nashik': (19.997, 73.791),
        'Jalgaon': (21.160, 75.569),
        'Dhule': (21.196, 74.774),
        'Nandurbar': (21.374, 74.226),
        'Amravati': (20.844, 77.804),
        'Akola': (20.714, 76.995),
        'Buldhana': (20.503, 76.177),
        'Washim': (20.109, 76.778),
        'Yavatmal': (20.384, 77.775),
        'Aurangabad': (19.876, 75.343),
        'Parbhani': (19.268, 76.774),
        'Latur': (18.379, 76.508),
        'Hingoli': (19.717, 77.154),
        'Nagpur': (21.146, 79.089),
        'Wardha': (20.763, 78.609),
        'Bhandara': (21.305, 79.263),
        'Chandrapur': (19.278, 79.294),
        'Gondia': (21.443, 80.189),
    }
    
    closest_district = 'Pune'
    min_distance = float('inf')
    
    for district, (lat, lon) in districts.items():
        # Euclidean distance
        distance = ((latitude - lat) ** 2 + (longitude - lon) ** 2) ** 0.5
        if distance < min_distance:
            min_distance = distance
            closest_district = district
    
    return closest_district
