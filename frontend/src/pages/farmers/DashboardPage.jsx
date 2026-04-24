import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getCropTranslation, getDistrictTranslation } from '../../utils/i18n';
import { weatherAPI, soilAPI } from '../../services/api';
import { TemperatureTrendChart, RainfallChart, SoilNutrientsChart, CropPerformanceChart } from '../../charts/Charts';
import useGeolocation from '../../hooks/useGeolocation';
import dashboardBgVideo from './videos/dashboard.mp4';
import { FiBarChart2, FiTarget, FiActivity } from 'react-icons/fi';

const DashboardPage = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { location, loading: locationLoading, error: locationError, getLocation } = useGeolocation();
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

  return (
    <div className="flex h-screen bg-transparent dark:bg-transparent">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} userName={userName} />
      
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

        {/* Dashboard Content Wrapper */}
        <div className="dashboard-content relative z-10">
          <div className="p-8 relative z-10">
          <div className="page-header animate-fadeInUp">
            <h1 className="page-title">
              {userRole === 'admin' ? getTranslation(language, 'adminDashboard') : getTranslation(language, 'dashboard')}
            </h1>
            <p className="page-subtitle">
              {userRole === 'admin' 
                ? `${getTranslation(language, 'welcome')}, Administrator! ${getTranslation(language, 'monitorSystem')}.`
                : `${getTranslation(language, 'welcome')}, ${userName}! Live monitor of your farm`
              }
            </p>
            <div className="page-divider"></div>
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            {/* Location Card */}
            <div className="farm-card bg-yellow-100 dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 overflow-hidden transition-shadow duration-300">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <h2 className="text-3xl font-bold flex items-center gap-3">📍 {getTranslation(language, 'yourLocation')}</h2>
                <p className="text-green-100 mt-2 text-lg">Your Farm Position</p>
              </div>
              
              <div className="p-6">
                <button
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl mb-6 transition disabled:opacity-50 shadow-lg text-lg"
                >
                  {locationLoading ? '📡 ' + getTranslation(language, 'gettingLocation') : '🗺️ ' + getTranslation(language, 'detectCurrentLocation')}
                </button>

                {locationError && (
                  <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded mb-4 text-red-700 dark:text-red-200">
                    ⚠️ {locationError}
                  </div>
                )}

                {selectedLocation && (
                  <div className="space-y-3 text-gray-700 dark:text-gray-200">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-green-700 dark:text-green-300">📌 Latitude</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedLocation.latitude.toFixed(4)}°</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-blue-700 dark:text-blue-300">📌 Longitude</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedLocation.longitude.toFixed(4)}°</p>
                    </div>
                    {district && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">🏘️ District</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{getDistrictTranslation(district, language)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Weather Card */}
            {weather && (
              <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-blue-200 dark:border-blue-700 overflow-hidden transition-shadow duration-300" style={{animationDelay: '0.2s'}}>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <h2 className="text-3xl font-bold flex items-center gap-3">🌤️ {getTranslation(language, 'weatherInformationLabel')}</h2>
                  <p className="text-blue-100 mt-2 text-lg">{weather.description}</p>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700 text-center">
                    <p className="text-orange-700 dark:text-orange-300 text-sm font-semibold">🌡️ Temperature</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{weather.temperature}°C</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 text-center">
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold">💧 Humidity</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{weather.humidity}%</p>
                  </div>
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border-2 border-cyan-300 dark:border-cyan-700 text-center">
                    <p className="text-cyan-700 dark:text-cyan-300 text-sm font-semibold">🌧️ Rainfall</p>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{weather.rainfall}mm</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-300 dark:border-green-700 text-center">
                    <p className="text-green-700 dark:text-green-300 text-sm font-semibold">💨 Condition</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">Good</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            {/* Total Predictions Card */}
            <div className="dashboard-stat-card">
              <div className="stat-card-icon green">
                <FiBarChart2 size={24} />
              </div>
              <h3 className="stat-card-title">Total Predictions</h3>
              <p className="stat-card-value">--</p>
              <p className="stat-card-desc">Total crop suggestions</p>
            </div>

            {/* Last Recommendation Card */}
            <div className="dashboard-stat-card" style={{animationDelay: '0.05s'}}>
              <div className="stat-card-icon blue">
                <FiTarget size={24} />
              </div>
              <h3 className="stat-card-title">Last Recommendation</h3>
              <p className="stat-card-value">🌽</p>
              <p className="stat-card-desc">Best crop for season</p>
            </div>

            {/* Farm Health Card */}
            <div className="dashboard-stat-card" style={{animationDelay: '0.1s'}}>
              <div className="stat-card-icon green">
                <FiActivity size={24} />
              </div>
              <h3 className="stat-card-title">Farm Health</h3>
              <p className="stat-card-value status-good">✓ Good</p>
              <p className="stat-card-desc">Farm conditions optimal</p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mt-12 mb-8 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white rounded-2xl p-8 shadow-xl mb-8 border-4 border-green-300 dark:border-green-700">
              <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">📊 {getTranslation(language, 'analyticsInsights')}</h2>
              <p className="text-green-100 text-lg">Monitor your farm's health and performance in real-time</p>
            </div>
            
            {/* Temperature and Rainfall Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-orange-200 dark:border-orange-700 overflow-hidden transition-shadow duration-300">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <h3 className="text-2xl font-bold flex items-center gap-3">🌡️ {getTranslation(language, 'temperatureTrend')}</h3>
                  <p className="text-orange-100 mt-2">Weekly temperature changes</p>
                </div>
                <div className="p-6">
                  <div style={{ position: 'relative', height: '300px' }}>
                    <TemperatureTrendChart data={temperatureData} />
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500 mt-4">
                    <p className="text-orange-700 dark:text-orange-300 text-sm font-semibold">📈 Average Temperature</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mt-2">29°C</p>
                    <p className="text-orange-600 dark:text-orange-300 text-xs mt-2">Ideal for monsoon crops</p>
                  </div>
                </div>
              </div>

              <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-blue-200 dark:border-blue-700 overflow-hidden transition-shadow duration-300" style={{animationDelay: '0.05s'}}>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <h3 className="text-2xl font-bold flex items-center gap-3">🌧️ {getTranslation(language, 'rainfallPattern')}</h3>
                  <p className="text-blue-100 mt-2">Weekly rainfall distribution</p>
                </div>
                <div className="p-6">
                  <div style={{ position: 'relative', height: '300px' }}>
                    <RainfallChart data={rainfallData} />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold">💧 Total Rainfall</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">43mm</p>
                    <p className="text-blue-600 dark:text-blue-300 text-xs mt-2">Good moisture for crops</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Soil Nutrients and Crop Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-green-200 dark:border-green-700 overflow-hidden transition-shadow duration-300">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <h3 className="text-2xl font-bold flex items-center gap-3">🧪 {getTranslation(language, 'soilNutrients')}</h3>
                  <p className="text-green-100 mt-2">Soil health analysis</p>
                </div>
                <div className="p-6">
                  <div style={{ position: 'relative', height: '250px' }}>
                    <SoilNutrientsChart data={mockSoilData} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
                      <p className="text-green-700 dark:text-green-300 text-xs font-bold">pH LEVEL</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{mockSoilData.ph}</p>
                      <p className="text-green-600 dark:text-green-300 text-xs mt-1">Optimal</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                      <p className="text-blue-700 dark:text-blue-300 text-xs font-bold">MOISTURE</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">65%</p>
                      <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">Good</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
                      <p className="text-yellow-700 dark:text-yellow-300 text-xs font-bold">STATUS</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">✓</p>
                      <p className="text-yellow-600 dark:text-yellow-300 text-xs mt-1">Healthy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="farm-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 border-purple-200 dark:border-purple-700 overflow-hidden transition-shadow duration-300" style={{animationDelay: '0.05s'}}>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                  <h3 className="text-2xl font-bold flex items-center gap-3">🌾 {getTranslation(language, 'cropPerformance')}</h3>
                  <p className="text-purple-100 mt-2">Your crops' yield data</p>
                </div>
                <div className="p-6">
                  <div style={{ position: 'relative', height: '250px' }}>
                    <CropPerformanceChart data={cropPerformanceData} />
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-l-4 border-purple-500 rounded-lg">
                    <p className="text-purple-900 dark:text-purple-100 font-bold">💡 Smart Recommendation</p>
                    <p className="text-purple-800 dark:text-purple-200 text-sm mt-2">Your sugarcane shows excellent yield performance (85%). Consider expanding cultivation area for better returns.</p>
                  </div>
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


export default DashboardPage;
