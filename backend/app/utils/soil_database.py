"""
Sample soil data for Maharashtra districts
In production, this would come from the database
"""

DISTRICT_SOIL_DATA = {
    "Pune": {
        "nitrogen": 150.5,
        "phosphorus": 45.2,
        "potassium": 320.8,
        "ph": 7.2
    },
    "Satara": {
        "nitrogen": 145.3,
        "phosphorus": 48.1,
        "potassium": 310.5,
        "ph": 7.1
    },
    "Kolhapur": {
        "nitrogen": 155.2,
        "phosphorus": 50.3,
        "potassium": 330.2,
        "ph": 7.3
    },
    "Solapur": {
        "nitrogen": 120.3,
        "phosphorus": 36.8,
        "potassium": 265.5,
        "ph": 7.6
    },
    "Nashik": {
        "nitrogen": 140.8,
        "phosphorus": 42.5,
        "potassium": 295.3,
        "ph": 7.0
    },
    "Jalgaon": {
        "nitrogen": 138.2,
        "phosphorus": 41.3,
        "potassium": 290.5,
        "ph": 7.1
    },
    "Dhule": {
        "nitrogen": 132.5,
        "phosphorus": 39.8,
        "potassium": 282.3,
        "ph": 7.4
    },
    "Nandurbar": {
        "nitrogen": 135.8,
        "phosphorus": 40.5,
        "potassium": 288.2,
        "ph": 7.2
    },
    "Amravati": {
        "nitrogen": 130.4,
        "phosphorus": 40.1,
        "potassium": 285.2,
        "ph": 7.4
    },
    "Akola": {
        "nitrogen": 125.6,
        "phosphorus": 38.2,
        "potassium": 275.4,
        "ph": 7.5
    },
    "Buldhana": {
        "nitrogen": 128.1,
        "phosphorus": 39.5,
        "potassium": 278.8,
        "ph": 7.3
    },
    "Washim": {
        "nitrogen": 126.7,
        "phosphorus": 38.9,
        "potassium": 277.1,
        "ph": 7.4
    },
    "Yavatmal": {
        "nitrogen": 129.3,
        "phosphorus": 39.7,
        "potassium": 283.5,
        "ph": 7.2
    },
    "Aurangabad": {
        "nitrogen": 128.5,
        "phosphorus": 39.2,
        "potassium": 280.3,
        "ph": 7.3
    },
    "Parbhani": {
        "nitrogen": 127.2,
        "phosphorus": 38.8,
        "potassium": 279.5,
        "ph": 7.2
    },
    "Latur": {
        "nitrogen": 122.1,
        "phosphorus": 37.4,
        "potassium": 270.2,
        "ph": 7.5
    },
    "Hingoli": {
        "nitrogen": 125.5,
        "phosphorus": 38.6,
        "potassium": 274.8,
        "ph": 7.3
    },
    "Nagpur": {
        "nitrogen": 135.2,
        "phosphorus": 43.5,
        "potassium": 300.1,
        "ph": 7.2
    },
    "Wardha": {
        "nitrogen": 133.8,
        "phosphorus": 42.1,
        "potassium": 297.3,
        "ph": 7.1
    },
    "Bhandara": {
        "nitrogen": 137.5,
        "phosphorus": 44.2,
        "potassium": 305.8,
        "ph": 6.9
    },
    "Chandrapur": {
        "nitrogen": 131.2,
        "phosphorus": 40.8,
        "potassium": 287.5,
        "ph": 7.0
    },
    "Gondia": {
        "nitrogen": 136.4,
        "phosphorus": 43.9,
        "potassium": 302.1,
        "ph": 6.8
    },
}

def get_soil_data(district: str) -> dict:
    """Get soil data for a district"""
    return DISTRICT_SOIL_DATA.get(district, {
        "nitrogen": 130.0,
        "phosphorus": 40.0,
        "potassium": 290.0,
        "ph": 7.2
    })
