import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import DistrictSelect from '../../components/DistrictSelect';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getCropTranslation, getDistrictTranslation } from '../../utils/i18n';

const ProfilePage = ({ onNavigate }) => {
  const { language } = useApp();
  const [farmer, setFarmer] = useState({
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@agrosahyadri.com',
    district: 'Pune',
    village: 'Dhave',
    farmSize: '5 acres',
    soilType: 'Black Soil',
    cropsGrown: ['Sugarcane', 'Jowar', 'Pulses'],
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(farmer);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSave = () => {
    setFarmer(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(farmer);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordMessage('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError(getTranslation(language, 'allFieldsRequired'));
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError(getTranslation(language, 'passwordMismatch'));
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError(getTranslation(language, 'passwordMinLength'));
      return;
    }

    // TODO: Call API to change password
    setPasswordMessage(getTranslation(language, 'passwordChanged'));
    setPasswordData({ current: '', new: '', confirm: '' });

    setTimeout(() => {
      setPasswordMessage('');
    }, 3000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="profile" onNavigate={onNavigate} userName={farmer.name} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            {getTranslation(language, 'myProfile')}
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-4 font-semibold transition ${
                activeTab === 'profile'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {getTranslation(language, 'farmerInformation')}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-4 px-4 font-semibold transition ${
                activeTab === 'password'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {getTranslation(language, 'changePassword')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="lg:col-span-2">
                <div className="card card-content">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {getTranslation(language, 'farmerInformation')}
                    </h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition btn-hover"
                    >
                      {isEditing ? getTranslation(language, 'cancel') : getTranslation(language, 'editProfile')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'fullName')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={editData.name}
                          onChange={handleChange}
                          className="input-field"
                        />
                      ) : (
                        <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.name}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'phoneNumber')}
                      </label>
                      <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.phone}</p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'email')}
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={editData.email}
                          onChange={handleChange}
                          className="input-field"
                        />
                      ) : (
                        <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.email}</p>
                      )}
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'district')}
                      </label>
                      {isEditing ? (
                        <DistrictSelect
                          value={editData.district}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.district}</p>
                      )}
                    </div>

                    {/* Village */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'village')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="village"
                          value={editData.village}
                          onChange={handleChange}
                          className="input-field"
                        />
                      ) : (
                        <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.village}</p>
                      )}
                    </div>

                    {/* Farm Size */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'farmSize')}
                      </label>
                      <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.farmSize}</p>
                    </div>

                    {/* Soil Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'soilType')}
                      </label>
                      <p className="text-lg text-gray-800 dark:text-gray-100">{farmer.soilType}</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-8 flex gap-4">
                      <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition btn-hover"
                      >
                        {getTranslation(language, 'save')}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition btn-hover"
                      >
                        {getTranslation(language, 'cancel')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Crops Grown */}
                <div className="card card-content mt-6 hover:shadow-lg dark:hover:shadow-2xl">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                    🌾 {getTranslation(language, 'cropsGrown')}
                  </h3>
                  <div className="space-y-3">
                    {farmer.cropsGrown.map((crop, idx) => (
                      <div key={idx} className="flex items-center p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                        <span className="text-gray-700 dark:text-gray-200">{getCropTranslation(crop, language)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="lg:col-span-2">
                <div className="card card-content">
                  <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-8">
                    {getTranslation(language, 'changePassword')}
                  </h2>

                  {passwordMessage && (
                    <div className="info-box info-box-green mb-6">
                      {passwordMessage}
                    </div>
                  )}

                  {passwordError && (
                    <div className="info-box info-box-red mb-6">
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="current"
                          value={passwordData.current}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'newPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="new"
                          value={passwordData.new}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {getTranslation(language, 'confirmPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirm"
                          value={passwordData.confirm}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition btn-hover mt-4"
                    >
                      {getTranslation(language, 'changePassword')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div>
              <div className="stat-card mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">📊 {getTranslation(language, 'statistics')}</h3>
                <div className="space-y-4">
                  <div className="p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-default">
                    <p className="stat-label">{getTranslation(language, 'totalPredictionsLabel')}</p>
                    <p className="stat-value">12</p>
                  </div>
                  <div className="p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-default">
                    <p className="stat-label">{getTranslation(language, 'memberSince')}</p>
                    <p className="stat-value">Jan 2024</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="stat-card hover:shadow-lg dark:hover:shadow-2xl">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{getTranslation(language, 'accountStatus')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <span className="w-3 h-3 bg-green-600 rounded-full mr-3"></span>
                    <span className="text-gray-700 dark:text-gray-200">{getTranslation(language, 'active')}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 px-3">
                    {getTranslation(language, 'lastLogin')}: Today
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

export default ProfilePage;
