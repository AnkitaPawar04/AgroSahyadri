import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getDistrictTranslation } from '../../utils/i18n';
import { weatherAPI } from '../../services/api';

// District coordinates for weather API
const DISTRICTS_COORDINATES = {
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Nagpur': { lat: 21.1458, lon: 79.0882 },
  'Ahmednagar': { lat: 19.0944, lon: 74.7421 },
  'Nashik': { lat: 19.9975, lon: 73.7898 },
  'Aurangabad': { lat: 19.8762, lon: 75.3433 },
  'Akola': { lat: 20.7076, lon: 77.0193 },
};

const AdminWeatherAlertsPage = () => {
  const { language } = useApp();
  const [weatherData, setWeatherData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({
    district: 'Pune',
    message: '',
    schedule: 'immediate'
  });
  const [message, setMessage] = useState({ type: '', text: '', visible: false });
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Fetch weather data for all districts
  useEffect(() => {
    const fetchAllWeather = async () => {
      setLoadingWeather(true);
      try {
        const weatherPromises = Object.entries(DISTRICTS_COORDINATES).map(async ([district, coords]) => {
          try {
            const response = await weatherAPI.getCurrentWeather(coords.lat, coords.lon);
            return { district, data: response.data };
          } catch (error) {
            console.error(`Error fetching weather for ${district}:`, error);
            return { district, data: null };
          }
        });

        const results = await Promise.all(weatherPromises);
        const weatherMap = {};
        results.forEach(({ district, data }) => {
          weatherMap[district] = data;
        });
        setWeatherData(weatherMap);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setMessage({ type: 'error', text: 'Failed to fetch weather data', visible: true });
        setTimeout(() => setMessage({ ...message, visible: false }), 3000);
      }
      setLoadingWeather(false);
    };

    fetchAllWeather();
  }, []);

  const handleAlertChange = (field, value) => {
    setAlertForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendAlert = (e) => {
    e.preventDefault();
    
    if (!alertForm.message.trim()) {
      setMessage({ type: 'error', text: getTranslation(language, 'enterAlertMessage'), visible: true });
      setTimeout(() => setMessage({ ...message, visible: false }), 3000);
      return;
    }

    const newAlert = {
      id: Math.max(...alerts.map(a => a.id), 0) + 1,
      district: alertForm.district,
      message: alertForm.message,
      date: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setAlerts([newAlert, ...alerts]);
    setAlertForm({ district: 'Pune', message: '', schedule: 'immediate' });
    setShowAlertForm(false);
    setMessage({ 
      type: 'success', 
      text: '✓ ' + getTranslation(language, 'alertSent') + ' ' + alertForm.district, 
      visible: true 
    });
    setTimeout(() => setMessage({ ...message, visible: false }), 3000);
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    setMessage({ type: 'success', text: getTranslation(language, 'alertDeleted'), visible: true });
    setTimeout(() => setMessage({ ...message, visible: false }), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="weather" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {message.visible && (
            <div className={`mb-6 p-4 rounded-lg text-white font-semibold ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">🌦️ {getTranslation(language, 'weatherAlertsPage')}</h1>
              <p className="text-gray-600 text-lg mt-2">{getTranslation(language, 'monitorWeatherSendAlerts')}</p>
            </div>
            {!showAlertForm && (
              <button
                onClick={() => setShowAlertForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                ➕ Send Alert
              </button>
            )}
          </div>

          {showAlertForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📢 Send Weather Alert</h2>
              
              <form onSubmit={handleSendAlert} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">District</label>
                    <select
                      value={alertForm.district}
                      onChange={(e) => handleAlertChange('district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {Object.keys(DISTRICTS_COORDINATES).map(d => (
                        <option key={d} value={d}>{getDistrictTranslation(d, language)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Schedule</label>
                    <select
                      value={alertForm.schedule}
                      onChange={(e) => handleAlertChange('schedule', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="immediate">Send Immediately</option>
                      <option value="tomorrow">Tomorrow Morning</option>
                      <option value="scheduled">Schedule for Later</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Alert Message</label>
                  <textarea
                    value={alertForm.message}
                    onChange={(e) => handleAlertChange('message', e.target.value)}
                    placeholder="e.g., Heavy rainfall expected tomorrow. Protect your crops..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    📢 Send Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAlertForm(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Weather Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loadingWeather ? (
              <div className="col-span-full flex justify-center items-center py-8">
                <div className="text-gray-500">Loading weather data...</div>
              </div>
            ) : (
              Object.entries(DISTRICTS_COORDINATES).map(([district]) => {
                const weather = weatherData[district];
                return (
                  <div key={district} className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">📍 {getDistrictTranslation(district, language)}</h3>
                    
                    {weather ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Temperature</span>
                          <span className="text-2xl font-bold text-red-600">{Math.round(weather.temperature)}°C</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Humidity</span>
                          <span className="text-2xl font-bold text-blue-600">{weather.humidity}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Rainfall</span>
                          <span className="text-2xl font-bold text-green-600">{weather.rainfall}mm</span>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-gray-700 font-semibold capitalize">{weather.description}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Unable to load weather data</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Alerts History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 {getTranslation(language, 'alertHistory')}</h2>
            
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{alert.message}</h3>
                        <p className="text-sm text-gray-600">📍 {getDistrictTranslation(alert.district, language)} • {alert.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.status}
                        </span>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">{getTranslation(language, 'noAlertsSent')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWeatherAlertsPage;
