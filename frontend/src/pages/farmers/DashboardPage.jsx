import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getCropTranslation, getDistrictTranslation } from '../../utils/i18n';
import { weatherAPI, soilAPI } from '../../services/api';
import { TemperatureTrendChart, RainfallChart, SoilNutrientsChart, CropPerformanceChart } from '../../charts/Charts';
import useGeolocation from '../../hooks/useGeolocation';

const DashboardPage = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { language } = useApp();
  const [weather, setWeather] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [district, setDistrict] = useState('');
  const [soilData, setSoilData] = useState(null);

  // Get user role from storage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = localStorage.getItem('is_admin') === 'true' || user.email === 'ankita.pawar19@gmail.com';
  const userRole = isAdmin ? 'admin' : 'farmer';
  const userName = user.firstName || (userRole === 'admin' ? 'Admin' : 'Farmer');

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('is_admin', 'true');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  // Mock analytics data
  const temperatureData = [
    { day: 'Mon', temp: 28 },
    { day: 'Tue', temp: 30 },
    { day: 'Wed', temp: 29 },
    { day: 'Thu', temp: 32 },
    { day: 'Fri', temp: 31 },
    { day: 'Sat', temp: 27 },
    { day: 'Sun', temp: 25 },
  ];

  const rainfallData = [
    { day: 'Mon', rainfall: 5 },
    { day: 'Tue', rainfall: 0 },
    { day: 'Wed', rainfall: 12 },
    { day: 'Thu', rainfall: 8 },
    { day: 'Fri', rainfall: 3 },
    { day: 'Sat', rainfall: 0 },
    { day: 'Sun', rainfall: 15 },
  ];

  const mockSoilData = {
    nitrogen: 45,
    phosphorus: 35,
    potassium: 58,
    ph: 6.8,
  };

  const cropPerformanceData = [
    { crop: 'Sugarcane', yield: 85 },
    { crop: 'Maize', yield: 72 },
    { crop: 'Cotton', yield: 68 },
    { crop: 'Wheat', yield: 80 },
    { crop: 'Rice', yield: 78 },
  ];

  useEffect(() => {
    if (location) {
      fetchWeather(location.latitude, location.longitude);
    }
  }, [location]);

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await weatherAPI.getCurrentWeather(lat, lon);
      setWeather(response.data);
      setSelectedLocation({ latitude: lat, longitude: lon });
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    }
  };

  const handleGetLocation = () => {
    getLocation();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} userName={userName} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
              {userRole === 'admin' ? '👨‍💼 ' + getTranslation(language, 'adminDashboard') : '🌾 ' + getTranslation(language, 'dashboard')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
              {userRole === 'admin' 
                ? `${getTranslation(language, 'welcome')}, Administrator! ${getTranslation(language, 'monitorSystem')}.`
                : `${getTranslation(language, 'welcome')}, ${userName}! ${getTranslation(language, 'monitorFarm')}`
              }
            </p>
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card card-content hover:shadow-lg">
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">📍 {getTranslation(language, 'yourLocation')}</h2>
              
              <button
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="w-full bg-green-600 hover:bg-green-700 dark:hover:bg-green-600 dark:bg-green-700 text-white font-bold py-2 px-4 rounded-lg mb-4 transition disabled:opacity-50 btn-hover"
              >
                {locationLoading ? getTranslation(language, 'gettingLocation') : getTranslation(language, 'detectCurrentLocation')}
              </button>

              {locationError && (
                <div className="info-box info-box-red mb-4">
                  {locationError}
                </div>
              )}

              {selectedLocation && (
                <div className="space-y-2 text-gray-700 dark:text-gray-200">
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'latitude')}:</span> {selectedLocation.latitude.toFixed(4)}
                  </p>
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'longitude')}:</span> {selectedLocation.longitude.toFixed(4)}
                  </p>
                  {district && (
                    <p className="text-lg">
                      <span className="font-bold">{getTranslation(language, 'district')}:</span> <span className="text-green-600 dark:text-green-400 font-semibold">{getDistrictTranslation(district, language)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Weather Section */}
            {weather && (
              <div className="card card-content hover:shadow-lg">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">🌤️ {getTranslation(language, 'weatherInformationLabel')}</h2>
                <div className="space-y-2 text-gray-700 dark:text-gray-200">
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'temperature')}:</span> {weather.temperature}°C
                  </p>
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'humidity')}:</span> {weather.humidity}%
                  </p>
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'rainfall')}:</span> {weather.rainfall}mm
                  </p>
                  <p className="text-lg">
                    <span className="font-bold">{getTranslation(language, 'description')}:</span> {weather.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card hover:shadow-lg">
              <p className="stat-label">{getTranslation(language, 'totalPredictionsLabel')}</p>
              <p className="stat-value text-green-600 dark:text-green-400">--</p>
            </div>
            <div className="stat-card hover:shadow-lg">
              <p className="stat-label">{getTranslation(language, 'lastRecommendation')}</p>
              <p className="stat-value text-blue-600 dark:text-blue-400">--</p>
            </div>
            <div className="stat-card hover:shadow-lg">
              <p className="stat-label">{getTranslation(language, 'farmHealth')}</p>
              <p className="stat-value text-yellow-600 dark:text-yellow-400">Good</p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mt-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">📊 {getTranslation(language, 'analyticsInsights')}</h2>
            
            {/* Temperature and Rainfall Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-4">🌡️ {getTranslation(language, 'temperatureTrend')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <TemperatureTrendChart data={temperatureData} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  📈 {getTranslation(language, 'averageTemperature')}: <span className="font-bold">29°C</span>
                </p>
              </div>

              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">🌧️ {getTranslation(language, 'rainfallPattern')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <RainfallChart data={rainfallData} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  💧 {getTranslation(language, 'totalRainfall')}: <span className="font-bold">43mm</span>
                </p>
              </div>
            </div>

            {/* Soil Nutrients and Crop Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">🧪 {getTranslation(language, 'soilNutrients')} {getTranslation(language, 'analyticsInsights')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <SoilNutrientsChart data={mockSoilData} />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                    <p className="text-sm text-gray-600 dark:text-gray-400">pH Level</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{mockSoilData.ph}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Moisture</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">65%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">✓ Good</p>
                  </div>
                </div>
              </div>

              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4">🌾 {getTranslation(language, 'cropPerformance')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <CropPerformanceChart data={cropPerformanceData} />
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-bold">💡 Recommendation:</span> Your sugarcane shows excellent yield performance. Consider expanding cultivation area.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default DashboardPage;
