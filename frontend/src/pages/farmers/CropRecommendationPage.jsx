import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MaharashtraMap from '../../maps/MaharashtraMap';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getCropTranslation, getDistrictTranslation } from '../../utils/i18n';
import { cropAPI, weatherAPI, soilAPI } from '../../services/api';
import { CropPerformanceChart } from '../../charts/Charts';
import useGeolocation from '../../hooks/useGeolocation';
import dashboardBgVideo from './videos/dashboard.mp4';

const CropRecommendationPage = ({ onNavigate }) => {
  const { language } = useApp();
  const { location, getLocation } = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [season, setSeason] = useState('Kharif');
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [district, setDistrict] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seasonalCrops, setSeasonalCrops] = useState([]);
  
  // Soil and weather parameters
  const [soilParams, setSoilParams] = useState({
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    ph: 6.5,
    temperature: 25,
    humidity: 60,
    rainfall: 100
  });

  // Clear recommendation when season changes
  useEffect(() => {
    setRecommendation(null);
    setSeasonalCrops([]);
    setError('');
  }, [season]);

  const handleMapClick = (lat, lon) => {
    setSelectedLocation({ latitude: lat, longitude: lon });
    setRecommendation(null); // Clear previous recommendation when location changes
    setSeasonalCrops([]); // Clear seasonal crops
    determineDistrict(lat, lon);
  };

  const determineDistrict = (lat, lon) => {
    // All Maharashtra districts with coordinates
    const districts = [
      // Western Maharashtra
      { name: 'Pune', lat: 18.516, lon: 73.856 },
      { name: 'Satara', lat: 17.665, lon: 73.912 },
      { name: 'Kolhapur', lat: 16.702, lon: 73.735 },
      { name: 'Solapur', lat: 17.656, lon: 75.905 },
      
      // Northern Maharashtra
      { name: 'Nashik', lat: 19.997, lon: 73.791 },
      { name: 'Jalgaon', lat: 21.160, lon: 75.569 },
      { name: 'Dhule', lat: 21.196, lon: 74.774 },
      { name: 'Nandurbar', lat: 21.374, lon: 74.226 },
      
      // Eastern Maharashtra
      { name: 'Amravati', lat: 20.844, lon: 77.804 },
      { name: 'Akola', lat: 20.714, lon: 76.995 },
      { name: 'Buldhana', lat: 20.503, lon: 76.177 },
      { name: 'Washim', lat: 20.109, lon: 76.778 },
      { name: 'Yavatmal', lat: 20.384, lon: 77.775 },
      
      // Central Maharashtra
      { name: 'Aurangabad', lat: 19.876, lon: 75.343 },
      { name: 'Parbhani', lat: 19.268, lon: 76.774 },
      { name: 'Latur', lat: 18.379, lon: 76.508 },
      { name: 'Hingoli', lat: 19.717, lon: 77.154 },
      
      // Vidarbha
      { name: 'Nagpur', lat: 21.146, lon: 79.089 },
      { name: 'Wardha', lat: 20.763, lon: 78.609 },
      { name: 'Bhandara', lat: 21.305, lon: 79.263 },
      { name: 'Chandrapur', lat: 19.278, lon: 79.294 },
      { name: 'Gondia', lat: 21.443, lon: 80.189 },
    ];

    let closestDistrict = 'Pune';
    let minDistance = Infinity;

    districts.forEach((d) => {
      const distance = Math.sqrt((lat - d.lat) ** 2 + (lon - d.lon) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestDistrict = d.name;
      }
    });

    setDistrict(closestDistrict);
    // Auto-fetch soil parameters for the determined district
    fetchSoilParametersForDistrict(closestDistrict);
  };

  const fetchSoilParametersForDistrict = async (districtName) => {
    try {
      const response = await soilAPI.getSoilData(districtName);
      if (response.data) {
        setSoilParams(prev => ({
          ...prev,
          nitrogen: response.data.nitrogen || 50,
          phosphorus: response.data.phosphorus || 50,
          potassium: response.data.potassium || 50,
          ph: response.data.ph || 6.5
        }));
      }
    } catch (err) {
      console.log('Using default soil parameters for ' + districtName);
    }
  };

  const handleParameterChange = (param, value) => {
    setSoilParams(prev => ({
      ...prev,
      [param]: parseFloat(value) || 0
    }));
  };

  const handleGetRecommendation = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, get district-specific crops for more accurate recommendations
      const districtCropsResponse = await cropAPI.getDistrictCrops(district);
      
      // Get the appropriate crops based on selected season
      const seasonCropKey = season.toLowerCase() === 'kharif' ? 'kharif_crops' : 'rabi_crops';
      const seasonTopCropKey = season.toLowerCase() === 'kharif' ? 'kharif_top_crop' : 'rabi_top_crop';
      
      // Get soil data for the district
      const soilResponse = await soilAPI.getSoilData(district);
      const freshSoilParams = {
        nitrogen: soilResponse.data?.nitrogen || soilParams.nitrogen,
        phosphorus: soilResponse.data?.phosphorus || soilParams.phosphorus,
        potassium: soilResponse.data?.potassium || soilParams.potassium,
        ph: soilResponse.data?.ph || soilParams.ph,
        temperature: soilParams.temperature,
        humidity: soilParams.humidity,
        rainfall: soilParams.rainfall
      };
      
      setSoilParams(freshSoilParams);

      // Create recommendation object using district-specific data
      const recommendationData = {
        recommended_crop: districtCropsResponse.data[seasonTopCropKey] || 'Wheat',
        top_crops: districtCropsResponse.data[seasonCropKey] || ['Wheat', 'Barley', 'Chickpea'],
        confidence: 92,
        district: district,
        season: season
      };

      setRecommendation(recommendationData);
      
      // Set seasonal crops from district data
      const cropsToShow = districtCropsResponse.data[seasonCropKey] || [];
      setSeasonalCrops(
        cropsToShow.map((crop, idx) => ({
          crop: crop,
          suitability: 95 - (idx * 5),
          rainfall: season.toLowerCase() === 'kharif' ? `${800 - (idx * 100)}mm` : `${50 - (idx * 10)}mm`
        }))
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get recommendation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasonalCrops = async (districtName, selectedSeason, soilData = null) => {
    try {
      const farmerId = localStorage.getItem('farmer_id') || 1;
      
      // Use provided soil data or current state
      const soil = soilData || soilParams;
      
      // Adjust weather parameters based on season
      const weatherParams = selectedSeason === 'Kharif' 
        ? {
            temperature: soil.temperature || 25,
            humidity: 80, // High humidity during monsoon
            rainfall: 800 // High rainfall during monsoon
          }
        : {
            temperature: soil.temperature || 20,
            humidity: 40, // Low humidity during winter
            rainfall: 50 // Low rainfall during rabi
          };
      
      // Get personalized seasonal prediction using the soil parameters
      const response = await cropAPI.predictCrop(
        selectedLocation.latitude,
        selectedLocation.longitude,
        selectedSeason,
        farmerId,
        soil.nitrogen,
        soil.phosphorus,
        soil.potassium,
        weatherParams.temperature,
        weatherParams.humidity,
        soil.ph,
        weatherParams.rainfall
      );
      
      if (response.data && response.data.top_crops) {
        // Get all crops but skip the first 3 (already shown in recommendation card)
        const allCrops = [
          {
            crop: response.data.recommended_crop,
            suitability: response.data.confidence,
            rainfall: selectedSeason === 'Kharif' ? `800mm` : `50mm`
          },
          ...response.data.top_crops.map((crop, idx) => ({
            crop: typeof crop === 'string' ? crop : crop.crop,
            suitability: typeof crop === 'string' ? 90 - (idx * 5) : crop.confidence || 90 - (idx * 5),
            rainfall: selectedSeason === 'Kharif' ? `${800 - (idx * 100)}mm` : `${50 - (idx * 10)}mm`
          }))
        ];
        
        // Skip first 3 crops (shown in main card) and show next 3-4 as alternatives
        const seasonalAlternatives = allCrops.slice(3, 7);
        setSeasonalCrops(seasonalAlternatives.length > 0 ? seasonalAlternatives : allCrops.slice(3));
      }
    } catch (err) {
      console.log('Could not fetch seasonal crops');
    }
  };

  return (
    <div className="flex h-screen bg-transparent dark:bg-transparent">
      <Sidebar currentPage="crop-recommendation" onNavigate={onNavigate} userName="Farmer" />
      
      <div className="flex-1 overflow-auto farm-dashboard relative">
        {/* Background Video - Slow Cinematic Playback */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="dashboard-bg-video"
          ref={(video) => {
            if (video) video.playbackRate = 0.5;
          }}
        >
          <source src={dashboardBgVideo} type="video/mp4" />
        </video>

        <div className="dashboard-content relative z-10">
        <div className="p-8 relative z-10">
        {/* Top Navigation */}
        <div className="page-header animate-fadeInUp">
          <h1 className="page-title">Smart Recommendation</h1>
          <p className="page-subtitle">Input your soil data to discover the most profitable and sustainable crops.</p>
          <div className="page-divider"></div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 rounded-lg p-4 text-red-700 dark:text-red-200 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Main Grid: Map + Form */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          {/* Map Section */}
          <div className="lg:col-span-2 farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 overflow-hidden transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h2 className="text-3xl font-bold flex items-center gap-3">📍 Farm Location & Context</h2>
              <p className="text-green-100 mt-2 text-lg">Click on your farm location to auto-fetch soil data from nearby sensors</p>
            </div>
            
            <div className="p-6">
            
            <MaharashtraMap 
              onLocationSelect={handleMapClick}
              selectedLocation={selectedLocation}
            />

            {selectedLocation && (
              <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border-l-4 border-green-600">
                <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-3">📌 Selected Location:</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300">Latitude</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">{selectedLocation.latitude.toFixed(4)}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300">Longitude</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">{selectedLocation.longitude.toFixed(4)}°</p>
                  </div>
                </div>
                {district && (
                  <div className="mt-4 pt-4 border-t border-green-300 dark:border-green-600">
                    <p className="text-xs text-green-700 dark:text-green-300">District</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">{getDistrictTranslation(district, language)}</p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Form Section */}
          <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 overflow-hidden transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h2 className="text-3xl font-bold flex items-center gap-3">🎯 Planting Season</h2>
              <p className="text-green-100 mt-2 text-lg">Select your planting season</p>
            </div>
            
            <div className="p-6 space-y-4">
              {['Kharif', 'Rabi'].map((s) => (
                <label 
                  key={s}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                    season === s 
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-green-500' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500'
                  }`}
                >
                  <input
                    type="radio"
                    value={s}
                    checked={season === s}
                    onChange={(e) => setSeason(e.target.value)}
                    className="mr-3 w-4 h-4 accent-green-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{s}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{s === 'Kharif' ? 'Monsoon' : 'Winter'}</p>
                  </div>
                </label>
              ))}

              {/* Advanced Parameters */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500 transition font-semibold text-gray-900 dark:text-white flex items-center justify-between px-4"
                >
                  🔧 {showAdvanced ? 'Hide' : 'Show'} Soil Parameters
                  <span className="text-sm">{showAdvanced ? '−' : '+'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-4 max-h-96 overflow-y-auto">
                    {[
                      {name: 'nitrogen', label: 'Nitrogen (N)', min: 0, max: 140},
                      {name: 'phosphorus', label: 'Phosphorus (P)', min: 5, max: 145},
                      {name: 'potassium', label: 'Potassium (K)', min: 5, max: 205},
                      {name: 'temperature', label: 'Temperature (°C)', min: 10, max: 45},
                      {name: 'humidity', label: 'Humidity (%)', min: 10, max: 100},
                      {name: 'ph', label: 'pH Level', min: 3.5, max: 9.9, step: 0.1},
                      {name: 'rainfall', label: 'Rainfall (mm)', min: 20, max: 300},
                    ].map((param) => (
                      <div key={param.name}>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-900 dark:text-white">{param.label}</label>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{soilParams[param.name]}{param.name === 'ph' ? '' : param.label.includes('%') ? '%' : param.label.includes('°C') ? '°' : ''}</span>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step || 1}
                          value={soilParams[param.name]}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full accent-green-600 dark:accent-green-500 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGetRecommendation}
                disabled={loading || !selectedLocation}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                {loading ? '🔄 Getting Recommendation...' : '✨ Get Recommendation'}
              </button>
            </div>
          </div>
        </section>

        {/* Recommendation Card */}
        {recommendation && (
          <section className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 mb-10 animate-fadeInUp overflow-hidden transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <p className="text-sm font-bold text-green-100">✨ TOP RECOMMENDATIONS</p>
              <h3 className="text-3xl font-bold mt-2">🥇 Most Suitable Crop</h3>
              <p className="text-green-100 text-lg mt-1">Based on your soil conditions and location</p>
            </div>
            
            <div className="p-8">
              {/* Main Recommendation */}
              <div className="mb-8 p-8 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-3xl text-white shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-green-100 text-sm font-bold mb-2">BEST CHOICE FOR YOU</p>
                    <p className="text-5xl font-bold">{getCropTranslation(recommendation.recommended_crop, language)}</p>
                    <p className="text-green-100 text-lg mt-3">Peak Planting Window</p>
                  </div>
                  <div className="text-right">
                    <p className="text-6xl font-bold">{recommendation.confidence.toFixed(0)}%</p>
                    <p className="text-green-100 text-sm">Match</p>
                  </div>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{width: `${recommendation.confidence}%`}}
                  />
                </div>
              </div>

              {/* Alternative Crops */}
              {recommendation.top_crops && recommendation.top_crops.length > 0 && (
                <div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-4">Other Good Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.top_crops.slice(0, 4).map((crop, idx) => {
                    const confidence = typeof crop === 'string' ? 85 - (idx * 5) : crop.confidence || 85 - (idx * 5);
                    const badges = ['🥈', '🥉', '👉', '👉'];
                    return (
                      <div key={idx} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-700 border-l-4 border-green-600">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{badges[idx]} {getCropTranslation(typeof crop === 'string' ? crop : crop.crop || crop, language)}</p>
                          </div>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">{confidence.toFixed(0)}%</p>
                        </div>
                        <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 dark:bg-green-500 rounded-full transition-all"
                            style={{width: `${confidence}%`}}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </section>
        )}

        {/* Seasonal Crops */}
        {seasonalCrops.length > 0 && (
          <section className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 mb-10 animate-fadeInUp overflow-hidden transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h3 className="text-3xl font-bold">🌾 Alternative {season} Crops</h3>
              <p className="text-green-100 mt-2 text-lg">More crop options for {season} season</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {seasonalCrops.map((crop, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-green-50 dark:from-gray-700 to-white dark:to-gray-800 rounded-2xl p-6 border-l-4 border-green-600">
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">{crop.crop}</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Suitability:</span> <span className="font-bold text-green-600 dark:text-green-400">{crop.suitability || '85%'}</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Rainfall:</span> {crop.rainfall}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendationPage;
