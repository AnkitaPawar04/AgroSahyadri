"""
Utility to determine district from coordinates
"""

MAHARASHTRA_DISTRICTS = {
    "Ahmednagar": {"lat": 19.095, "lon": 74.745},
    "Akola": {"lat": 20.713, "lon": 77.014},
    "Amravati": {"lat": 20.933, "lon": 77.746},
    "Aurangabad": {"lat": 19.88, "lon": 75.343},
    "Beed": {"lat": 19.254, "lon": 75.762},
    "Bhandara": {"lat": 21.166, "lon": 79.253},
    "Buldhana": {"lat": 20.576, "lon": 76.170},
    "Chandrapur": {"lat": 19.985, "lon": 79.295},
    "Dhule": {"lat": 21.029, "lon": 74.769},
    "Gadchiroli": {"lat": 21.858, "lon": 79.758},
    "Gondia": {"lat": 21.458, "lon": 80.198},
    "Hingoli": {"lat": 19.716, "lon": 77.148},
    "Jalgaon": {"lat": 21.158, "lon": 75.569},
    "Jalna": {"lat": 19.841, "lon": 75.880},
    "Kolhapur": {"lat": 16.702, "lon": 73.735},
    "Latur": {"lat": 18.404, "lon": 76.230},
    "Nagpur": {"lat": 21.146, "lon": 79.088},
    "Nanded": {"lat": 19.162, "lon": 77.292},
    "Nashik": {"lat": 19.997, "lon": 73.791},
    "Navi Mumbai": {"lat": 19.033, "lon": 73.030},
    "Osmanabd": {"lat": 17.989, "lon": 76.398},
    "Parabhani": {"lat": 19.268, "lon": 76.749},
    "Parbani": {"lat": 19.268, "lon": 76.749},
    "Pimpri-Chinchwad": {"lat": 18.630, "lon": 73.800},
    "Pune": {"lat": 18.516, "lon": 73.856},
    "Raigad": {"lat": 18.598, "lon": 73.264},
    "Ratnagiri": {"lat": 16.982, "lon": 73.301},
    "Sangli": {"lat": 16.859, "lon": 74.566},
    "Satara": {"lat": 17.665, "lon": 73.912},
    "Sindhudurg": {"lat": 16.022, "lon": 73.539},
    "Solapur": {"lat": 17.656, "lon": 75.905},
    "Thane": {"lat": 19.218, "lon": 72.978},
    "Wardha": {"lat": 20.754, "lon": 78.579},
    "Washim": {"lat": 20.105, "lon": 77.512},
    "Yavatmal": {"lat": 20.403, "lon": 78.134},
}

def get_district_from_coordinates(latitude: float, longitude: float) -> str:
    """
    Get district name from latitude and longitude
    Uses nearest district center as approximation
    """
    min_distance = float('inf')
    closest_district = "Unknown"
    
    for district, coords in MAHARASHTRA_DISTRICTS.items():
        # Calculate simple distance
        distance = ((latitude - coords["lat"]) ** 2 + (longitude - coords["lon"]) ** 2) ** 0.5
        if distance < min_distance:
            min_distance = distance
            closest_district = district
    
    return closest_district
