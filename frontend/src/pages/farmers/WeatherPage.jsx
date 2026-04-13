import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getDistrictTranslation } from '../../utils/i18n';
import { weatherAPI, soilAPI } from '../../services/api';
import { TemperatureTrendChart, RainfallChart, SoilNutrientsChart } from '../../charts/Charts';
import useGeolocation from '../../hooks/useGeolocation';

const WeatherPage = ({ onNavigate }) => {
  const { language } = useApp();
  const { location, getLocation, loading: locationLoading } = useGeolocation();
  const [weather, setWeather] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [district, setDistrict] = useState('Pune');

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

  useEffect(() => {
    if (location) {
      fetchWeatherData(location.latitude, location.longitude);
    }
  }, [location]);

  const fetchWeatherData = async (lat, lon) => {
    setLoading(true);
    try {
      const weatherResponse = await weatherAPI.getCurrentWeather(lat, lon);
      setWeather(weatherResponse.data);

      // Mock district based on coordinates
      determineDistrict(lat, lon);
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  const determineDistrict = (lat, lon) => {
    const districts = [
      { name: 'Pune', lat: 18.516, lon: 73.856 },
      { name: 'Satara', lat: 17.665, lon: 73.912 },
      { name: 'Kolhapur', lat: 16.702, lon: 73.735 },
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
  };

  const fetchSoilData = async (dist) => {
    try {
      const response = await soilAPI.getSoilData(dist);
      setSoilData(response.data);
    } catch (err) {
      console.error('Failed to fetch soil data:', err);
    }
  };

  const handleFetchSoilData = () => {
    fetchSoilData(district);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage="weather" onNavigate={onNavigate} userName="Farmer" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">{getTranslation(language, 'weatherSoilInfo')}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weather Section */}
            <div className="card card-content hover:shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">🌤️ {getTranslation(language, 'weatherInfo')}</h2>
                <button
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-600 dark:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition btn-hover"
                >
                  {locationLoading ? getTranslation(language, 'loading') : getTranslation(language, 'refresh')}
                </button>
              </div>

              {weather ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'temperature')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{weather.temperature}°C</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'humidity')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{weather.humidity}%</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'rainfall')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{weather.rainfall}mm</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'condition')}</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-300 capitalize">{weather.description}</p>
                    </div>
                  </div>

                  <div className="info-box info-box-yellow">
                    <p className="text-sm"><span className="font-bold">{getTranslation(language, 'recommendation')}:</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>{getTranslation(language, 'clickRefresh')}</p>
                </div>
              )}
            </div>

            {/* Soil Section */}
            <div className="card card-content hover:shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">🌱 {getTranslation(language, 'soilData')}</h2>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    fetchSoilData(e.target.value);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option>Pune</option>
                  <option>Satara</option>
                  <option>Kolhapur</option>
                  <option>Nashik</option>
                  <option>Solapur</option>
                </select>
              </div>

              {soilData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'nitrogen')} </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-300">{soilData.nitrogen}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'phosphorus')} </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-300">{soilData.phosphorus}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'potassium')} </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-300">{soilData.potassium}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 hover:shadow-md transition">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getTranslation(language, 'phLevel')}</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-300">{soilData.ph}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'acidityAlkalinity')}</p>
                    </div>
                  </div>

                  <div className="info-box info-box-green">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-bold">{getTranslation(language, 'soilStatus')}:</span>
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleFetchSoilData}
                  className="w-full bg-green-600 hover:bg-green-700 dark:hover:bg-green-600 dark:bg-green-700 text-white font-bold py-3 rounded-lg mt-4 transition btn-hover"
                >
                  {getTranslation(language, 'loadSoilData')} {getDistrictTranslation(district, language)}
                </button>
              )}
            </div>
          </div>

          {/* Weather Forecast (Mock) */}
          <div className="mt-6 card card-content hover:shadow-lg mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">📅 {getTranslation(language, 'next5DaysForecast')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[getTranslation(language, 'today'), getTranslation(language, 'tomorrow'), getTranslation(language, 'day3'), getTranslation(language, 'day4'), getTranslation(language, 'day5')].map((day, idx) => (
                <div key={idx} className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:shadow-md transition">
                  <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">{day}</p>
                  <p className="text-2xl mb-2">🌤️</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">25-28°C</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">65% humidity</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">📊 {getTranslation(language, 'weatherSoilAnalytics')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-4">🌡️ {getTranslation(language, 'temperatureTrendChart')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <TemperatureTrendChart data={temperatureData} />
                </div>
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    📈 {getTranslation(language, 'weeklyAverageTemp')}: <span className="font-bold">29°C</span> | {getTranslation(language, 'peak')}: <span className="font-bold">32°C</span>
                  </p>
                </div>
              </div>

              <div className="card card-content hover:shadow-lg">
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">🌧️ {getTranslation(language, 'rainfallAnalysis')}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  <RainfallChart data={rainfallData} />
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💧 {getTranslation(language, 'totalWeeklyRainfall')}: <span className="font-bold">43mm</span> | {getTranslation(language, 'idealForCrops')}
                  </p>
                </div>
              </div>

              <div className="card card-content hover:shadow-lg lg:col-span-2">
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">🧪 {getTranslation(language, 'soilNutrientAnalysis')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div style={{ position: 'relative', height: '300px' }}>
                    <SoilNutrientsChart data={mockSoilData} />
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{getTranslation(language, 'nitrogen')}</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{mockSoilData.nitrogen}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')} - {getTranslation(language, 'good')}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{getTranslation(language, 'phosphorus')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockSoilData.phosphorus}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')} - {getTranslation(language, 'adequate')}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{getTranslation(language, 'potassium')}</p>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mockSoilData.potassium}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTranslation(language, 'mgPerKg')} - {getTranslation(language, 'optimal')}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg h-full flex flex-col justify-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-3">💡 {getTranslation(language, 'recommendations')}</p>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
                        <li>{getTranslation(language, 'phOptimal')}</li>
                        <li>{getTranslation(language, 'nitrogenBalanced')}</li>
                        <li>{getTranslation(language, 'considerK')}</li>
                        <li>{getTranslation(language, 'moistureGood')}</li>
                      </ul>
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

export default WeatherPage;
