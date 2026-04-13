import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutConfirm from './LogoutConfirm';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../utils/i18n';

const Sidebar = ({ userName, currentPage, onNavigate }) => {
  const navigate = useNavigate();
  const { language } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check if user is admin
  const isAdmin = localStorage.getItem('is_admin') === 'true';

  const farmerMenuItems = [
    { id: 'dashboard', label: getTranslation(language, 'dashboard'), path: '/dashboard' },
    { id: 'crop-recommendation', label: getTranslation(language, 'cropRecommendation'), path: '/crop-recommendation' },
    { id: 'weather', label: getTranslation(language, 'weatherInformation'), path: '/weather' },
    { id: 'profile', label: getTranslation(language, 'profile'), path: '/profile' },
    { id: 'settings', label: getTranslation(language, 'settings'), path: '/settings' },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: getTranslation(language, 'dashboard'), path: '/admin/dashboard' },
    { id: 'farmers', label: getTranslation(language, 'farmerManagement'), path: '/admin/farmers' },
    { id: 'crops', label: getTranslation(language, 'cropManagement'), path: '/admin/crops' },
    { id: 'soil', label: getTranslation(language, 'soilManagement'), path: '/admin/soil' },
    { id: 'weather', label: getTranslation(language, 'weatherAlerts'), path: '/admin/weather' },
    { id: 'notifications', label: getTranslation(language, 'notifications'), path: '/admin/notifications' },
    { id: 'profile', label: getTranslation(language, 'adminProfile'), path: '/admin/profile' },
    { id: 'settings', label: getTranslation(language, 'adminSettings'), path: '/admin/settings' },
  ];

  const menuItems = isAdmin ? adminMenuItems : farmerMenuItems;

  const handleNavigateClick = (item) => {
    navigate(item.path);
    if (onNavigate) onNavigate(item.id);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      <div className={`w-64 text-white h-screen flex flex-col shadow-lg bg-green-700`}>
        {/* Header */}
        <div className={`p-6 border-b border-green-600`}>
          <h1 className="text-2xl font-bold">{getTranslation(language, 'appName')}</h1>
          <p className={`text-sm mt-2 text-green-200`}>
            {isAdmin ? '👨‍💼 ' + getTranslation(language, 'adminPanel') : `${getTranslation(language, 'welcome')}, ${userName || 'Farmer'}`}
          </p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigateClick(item)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition ${
                currentPage === item.id
                  ? 'bg-green-600 font-semibold'
                  : 'hover:bg-green-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t border-green-600`}>
          <button
            onClick={handleLogoutClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {getTranslation(language, 'logout')}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirm
        isOpen={showLogoutConfirm}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
