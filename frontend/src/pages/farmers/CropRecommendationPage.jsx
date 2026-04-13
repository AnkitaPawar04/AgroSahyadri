import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import MaharashtraMap from '../../maps/MaharashtraMap';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getCropTranslation, getDistrictTranslation } from '../../utils/i18n';
import { cropAPI, weatherAPI, soilAPI } from '../../services/api';
import { CropPerformanceChart } from '../../charts/Charts';
import useGeolocation from '../../hooks/useGeolocation';

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
      // Fetch fresh soil data for the selected district
      const soilResponse = await soilAPI.getSoilData(district);
      const freshSoilParams = {
        nitrogen: soilResponse.data?.nitrogen || soilParams.nitrogen,
        phosphorus: soilResponse.data?.phosphorus || soilParams.phosphorus,
        potassium: soilResponse.data?.potassium || soilParams.potassium,
        ph: soilResponse.data?.ph || soilParams.ph,
        temperature: soilParams.temperature, // Keep user's selection
        humidity: soilParams.humidity,
        rainfall: soilParams.rainfall
      };
      
      // Update state with fresh soil data
      setSoilParams(freshSoilParams);

      const farmerId = localStorage.getItem('farmer_id') || 1;
      const response = await cropAPI.predictCrop(
        selectedLocation.latitude,
        selectedLocation.longitude,
        season,
        farmerId,
        freshSoilParams.nitrogen,
        freshSoilParams.phosphorus,
        freshSoilParams.potassium,
        freshSoilParams.temperature,
        freshSoilParams.humidity,
        freshSoilParams.ph,
        freshSoilParams.rainfall
      );

      setRecommendation(response.data);
      
      // Fetch seasonal crops for the district
      await fetchSeasonalCrops(district, season, freshSoilParams);
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage="crop-recommendation" onNavigate={onNavigate} userName="Farmer" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">{getTranslation(language, 'cropRecommendationTitle')}</h1>

          {error && (
            <div className="mb-4 info-box info-box-red">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Map and Selection */}
            <div className="lg:col-span-2">
              <div className="card card-content hover:shadow-lg mb-6">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">{getTranslation(language, 'selectFarmLocation')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{getTranslation(language, 'clickMapToSelect')}</p>
                
                <MaharashtraMap 
                  onLocationSelect={handleMapClick}
                  selectedLocation={selectedLocation}
                />

                {selectedLocation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-bold">Selected Location:</span><br/>
                      Latitude: {selectedLocation.latitude.toFixed(4)}<br/>
                      Longitude: {selectedLocation.longitude.toFixed(4)}<br/>
                      {district && <><span className="font-bold">District:</span> <span className="text-green-600 dark:text-green-400">{getDistrictTranslation(district, language)}</span></>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Options Card */}
            <div className="lg:col-span-1">
              <div className="card card-content hover:shadow-lg mb-6">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">Options</h2>
                
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-200 font-bold mb-2">Season</label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:shadow-md transition dark:hover:bg-gray-700" style={{borderColor: season === 'Kharif' ? '#059669' : '#e5e7eb', backgroundColor: season === 'Kharif' ? 'rgba(5, 150, 105, 0.05)' : ''}}>
                      <input
                        type="radio"
                        value="Kharif"
                        checked={season === 'Kharif'}
                        onChange={(e) => setSeason(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold text-gray-800 dark:text-gray-100">Kharif (Monsoon)</span>
                    </label>

                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:shadow-md transition dark:hover:bg-gray-700" style={{borderColor: season === 'Rabi' ? '#059669' : '#e5e7eb', backgroundColor: season === 'Rabi' ? 'rgba(5, 150, 105, 0.05)' : ''}}>
                      <input
                        type="radio"
                        value="Rabi"
                        checked={season === 'Rabi'}
                        onChange={(e) => setSeason(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold text-gray-800 dark:text-gray-100">Rabi (Winter)</span>
                    </label>
                  </div>
                </div>

                {/* Soil Parameters */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-green-700 dark:text-green-400 hover:underline font-semibold text-sm mb-3 flex items-center"
                  >
                    {showAdvanced ? '▼' : '▶'} Soil Parameters (Auto-fetched)
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded max-h-96 overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Nitrogen (N): {soilParams.nitrogen}</label>
                        <input
                          type="range"
                          min="0"
                          max="140"
                          value={soilParams.nitrogen}
                          onChange={(e) => handleParameterChange('nitrogen', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Phosphorus (P): {soilParams.phosphorus}</label>
                        <input
                          type="range"
                          min="5"
                          max="145"
                          value={soilParams.phosphorus}
                          onChange={(e) => handleParameterChange('phosphorus', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Potassium (K): {soilParams.potassium}</label>
                        <input
                          type="range"
                          min="5"
                          max="205"
                          value={soilParams.potassium}
                          onChange={(e) => handleParameterChange('potassium', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Temperature (°C): {soilParams.temperature}</label>
                        <input
                          type="range"
                          min="10"
                          max="45"
                          value={soilParams.temperature}
                          onChange={(e) => handleParameterChange('temperature', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Humidity (%): {soilParams.humidity}</label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={soilParams.humidity}
                          onChange={(e) => handleParameterChange('humidity', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">pH: {soilParams.ph.toFixed(2)}</label>
                        <input
                          type="range"
                          min="3.5"
                          max="9.9"
                          step="0.1"
                          value={soilParams.ph}
                          onChange={(e) => handleParameterChange('ph', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">Rainfall (mm): {soilParams.rainfall}</label>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={soilParams.rainfall}
                          onChange={(e) => handleParameterChange('rainfall', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGetRecommendation}
                  disabled={loading || !selectedLocation}
                  className="w-full bg-green-600 hover:bg-green-700 dark:hover:bg-green-600 dark:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
                >
                  {loading ? 'Getting Recommendation...' : 'Get Recommendation'}
                </button>
              </div>
            </div>
          </div>

          {/* Recommendation Result */}
          {recommendation && (
            <div className="w-full mb-8">
              <div className="card card-content hover:shadow-lg">
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    ⭐ TOP 3 RECOMMENDATIONS - Based on your soil conditions and location
                  </p>
                </div>
                
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6">✅ Recommended Crops</h3>
                
                {/* Top recommendation - Highlighted */}
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-2">🥇 BEST CHOICE</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-3">{getCropTranslation(recommendation.recommended_crop, language)}</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-600 dark:bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${recommendation.confidence}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 font-bold text-lg text-gray-800 dark:text-gray-100">{recommendation.confidence.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Top 3 alternatives */}
                {recommendation.top_crops && recommendation.top_crops.length > 0 && (
                  <>
                    <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3">Other Good Options:</h4>
                    <div className="space-y-2">
                      {recommendation.top_crops.slice(0, 3).map((crop, idx) => {
                        const confidence = typeof crop === 'string' ? 85 - (idx * 5) : crop.confidence || 85 - (idx * 5);
                        return (
                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                {idx === 0 ? '🥈' : idx === 1 ? '🥉' : '👉'} {getCropTranslation(typeof crop === 'string' ? crop : crop.crop || crop, language)}
                              </p>
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{confidence.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                                style={{ width: `${confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Crop Analytics Section */}
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">📊 Crop Analytics & Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crop Performance Chart */}
              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4">🌾 Crop Performance Analysis</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <CropPerformanceChart 
                    data={recommendation && recommendation.top_crops ? 
                      recommendation.top_crops.slice(0, 4).map(crop => ({
                        crop: typeof crop === 'string' ? crop : crop.crop,
                        yield: typeof crop === 'string' ? 75 : crop.confidence || 75
                      }))
                      : 
                      [
                        { crop: 'Select location to see analysis', yield: 0 }
                      ]
                    } 
                  />
                </div>
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {recommendation ? 
                      <>🏆 Best performing: <span className="font-bold">{recommendation.recommended_crop} ({recommendation.confidence.toFixed(2)}% confidence)</span></>
                      : 
                      <>💡 Get a recommendation to see crop analysis</>
                    }
                  </p>
                </div>
              </div>

              {/* Season-based Recommendations */}
              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                  {season === 'Kharif' ? '🌊' : '❄️'} {season} Season - More Options
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Additional crops suitable for {season === 'Kharif' ? 'monsoon' : 'winter'} conditions in your area</p>
                <div className="space-y-3">
                  {seasonalCrops.length > 0 ? (
                    seasonalCrops.map((crop, idx) => (
                      <div key={idx} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-gray-800 dark:text-gray-200">{crop.crop}</p>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{crop.suitability.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                            <div
                              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${crop.suitability}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{crop.rainfall}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 italic">Get a recommendation first to see seasonal crops</p>
                  )}
                </div>
              </div>

              {/* Farming Tips and Insights */}
              <div className="card card-content hover:shadow-lg lg:col-span-2">
                <h3 className="text-2xl font-bold text-teal-700 dark:text-teal-400 mb-4">💡 Farming Tips & Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg">
                    <p className="font-bold text-teal-800 dark:text-teal-200 mb-2">🌦️ Weather Optimization</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Plant during monsoon for best results. Monitor rainfall patterns and adjust irrigation accordingly.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="font-bold text-green-800 dark:text-green-200 mb-2">🧪 Soil Management</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Maintain optimal soil pH (6.5-7.5). Use balanced NPK fertilizers for maximum yield.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="font-bold text-blue-800 dark:text-blue-200 mb-2">💧 Water Management</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Practice drip irrigation for water conservation. Based on crop type, adjust irrigation frequency.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <p className="font-bold text-orange-800 dark:text-orange-200 mb-2">🌱 Disease Prevention</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Regular scouting for pests. Use organic pesticides when needed. Crop rotation recommended.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendationPage;
