import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getDistrictTranslation } from '../../utils/i18n';
import { soilAPI } from '../../services/api';

const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Chhatrapati Sambhaji Nagar', 'Dhule', 'Dindori',
  'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
  'Latur', 'Mumbai', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Navi Mumbai',
  'Osmananad', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli',
  'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
];

const AdminSoilManagementPage = () => {
  const { language } = useApp();
  const [selectedDistrict, setSelectedDistrict] = useState('Pune');
  const [soilData, setSoilData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '', visible: false });
  const [loading, setLoading] = useState(false);

  const currentSoil = soilData[selectedDistrict] || { nitrogen: 0, phosphorus: 0, potassium: 0, ph: 0 };

  // Fetch soil data for a district
  const fetchSoilData = async (district) => {
    setLoading(true);
    try {
      const response = await soilAPI.getSoilData(district);
      setSoilData(prev => ({
        ...prev,
        [district]: response.data
      }));
      setEditData(response.data);
    } catch (error) {
      console.error('Error fetching soil data:', error);
      setMessage({ type: 'error', text: 'Failed to fetch soil data', visible: true });
      setTimeout(() => setMessage({ ...message, visible: false }), 3000);
    }
    setLoading(false);
  };

  // Load initial district data
  useEffect(() => {
    fetchSoilData(selectedDistrict);
  }, [selectedDistrict]);

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    setIsEditing(false);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  const handleSaveSoilData = () => {
    if (editData.nitrogen < 0 || editData.phosphorus < 0 || editData.potassium < 0 || editData.ph <= 0) {
      setMessage({ type: 'error', text: 'Values must be positive', visible: true });
      setTimeout(() => setMessage({ ...message, visible: false }), 3000);
      return;
    }

    setSoilData(prev => ({
      ...prev,
      [selectedDistrict]: editData
    }));
    setIsEditing(false);
    setMessage({ type: 'success', text: `✓ Soil data for ${selectedDistrict} updated successfully`, visible: true });
    setTimeout(() => setMessage({ ...message, visible: false }), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="soil" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {message.visible && (
            <div className={`mb-6 p-4 rounded-lg text-white font-semibold ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">🌱 {getTranslation(language, 'soilManagementPage')}</h1>
            <p className="text-gray-600 text-lg mt-2">{getTranslation(language, 'manageSoilNutrients')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* District List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📍 {getTranslation(language, 'districts')}</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {MAHARASHTRA_DISTRICTS.map(district => (
                  <button
                    key={district}
                    onClick={() => handleDistrictChange(district)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      selectedDistrict === district
                        ? 'bg-green-600 text-white font-semibold'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {soilData[district] ? '✓' : '○'} {getDistrictTranslation(district, language)}
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Data Display/Edit */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Data Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">🌾 {getDistrictTranslation(selectedDistrict, language)}</h2>
                  {!isEditing && !loading && soilData[selectedDistrict] && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditData(currentSoil);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      ✏️ {getTranslation(language, 'editLabel')}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Loading soil data...</div>
                  </div>
                ) : isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{getTranslation(language, 'nitrogen2')} (N) - {getTranslation(language, 'ppm')}</label>
                      <input
                        type="number"
                        value={editData.nitrogen || ''}
                        onChange={(e) => handleEditChange('nitrogen', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{getTranslation(language, 'phosphorus2')} (P) - {getTranslation(language, 'ppm')}</label>
                      <input
                        type="number"
                        value={editData.phosphorus || ''}
                        onChange={(e) => handleEditChange('phosphorus', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{getTranslation(language, 'potassium2')} (K) - {getTranslation(language, 'ppm')}</label>
                      <input
                        type="number"
                        value={editData.potassium || ''}
                        onChange={(e) => handleEditChange('potassium', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{getTranslation(language, 'phLevel')}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editData.ph || ''}
                        onChange={(e) => handleEditChange('ph', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveSoilData}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        💾 {getTranslation(language, 'save')}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        {getTranslation(language, 'cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                      <p className="text-gray-600 text-sm font-semibold">{getTranslation(language, 'nitrogen2')} (N)</p>
                      <p className="text-2xl font-bold text-green-600">{currentSoil.nitrogen || 0}</p>
                      <p className="text-gray-500 text-xs">{getTranslation(language, 'ppm')}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-gray-600 text-sm font-semibold">{getTranslation(language, 'phosphorus2')} (P)</p>
                      <p className="text-2xl font-bold text-green-600">{currentSoil.phosphorus || 0}</p>
                      <p className="text-gray-500 text-xs">{getTranslation(language, 'ppm')}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-gray-600 text-sm font-semibold">{getTranslation(language, 'potassium2')} (K)</p>
                      <p className="text-2xl font-bold text-green-600">{currentSoil.potassium || 0}</p>
                      <p className="text-gray-500 text-xs">{getTranslation(language, 'ppm')}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-gray-600 text-sm font-semibold">{getTranslation(language, 'phLevel')}</p>
                      <p className="text-2xl font-bold text-green-600">{currentSoil.ph || 0}</p>
                      <p className="text-gray-500 text-xs">{getTranslation(language, 'phRange')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Soil Health Info */}
              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 {getTranslation(language, 'soilHealthGuide')}</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ <strong>{getTranslation(language, 'nitrogen2')}:</strong> {getTranslation(language, 'essentialForPlantGrowth')} (30-50 ppm {getTranslation(language, 'optimalRange')})</li>
                  <li>✓ <strong>{getTranslation(language, 'phosphorus2')}:</strong> {getTranslation(language, 'supportsRootDevelopment')} (20-40 ppm {getTranslation(language, 'optimalRange')})</li>
                  <li>✓ <strong>{getTranslation(language, 'potassium2')}:</strong> {getTranslation(language, 'improvesCropQuality')} (20-30 ppm {getTranslation(language, 'optimalRange')})</li>
                  <li>✓ <strong>pH:</strong> {getTranslation(language, 'mostCropsPrefer')} 6.0-7.5</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSoilManagementPage;
