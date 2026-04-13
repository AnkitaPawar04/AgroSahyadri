import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../contexts/AppContext';
import { getTranslation, getDistrictTranslation } from '../../utils/i18n';

const AdminNotificationsPage = () => {
  const { language } = useApp();
  const [notifications, setNotifications] = useState([
    { id: 1, message: '🎯 20 new farmers registered', date: '2026-03-25', targetUsers: 'All Farmers', type: 'info' },
    { id: 2, message: '⚠️ Heavy rainfall in Pune', date: '2026-03-24', targetUsers: 'Pune District', type: 'warning' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    message: '',
    targetType: 'all',
    district: 'Pune'
  });
  const [message, setMessage] = useState({ type: '', text: '', visible: false });

  const handleInputChange = (field, value) => {
    setNotificationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    
    if (!notificationForm.message.trim()) {
      setMessage({ type: 'error', text: getTranslation(language, 'enterMessage'), visible: true });
      setTimeout(() => setMessage({ ...message, visible: false }), 3000);
      return;
    }

    const newNotification = {
      id: Math.max(...notifications.map(n => n.id), 0) + 1,
      message: notificationForm.message,
      date: new Date().toISOString().split('T')[0],
      targetUsers: notificationForm.targetType === 'all' 
        ? getTranslation(language, 'allFarmers')
        : `${notificationForm.district} District`,
      type: 'info'
    };

    setNotifications([newNotification, ...notifications]);
    setNotificationForm({ message: '', targetType: 'all', district: 'Pune' });
    setShowForm(false);
    setMessage({ 
      type: 'success', 
      text: getTranslation(language, 'notificationSent') + ' ' + newNotification.targetUsers, 
      visible: true 
    });
    setTimeout(() => setMessage({ ...message, visible: false }), 3000);
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    setMessage({ type: 'success', text: getTranslation(language, 'notificationDeleted'), visible: true });
    setTimeout(() => setMessage({ ...message, visible: false }), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="notifications" />
      
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
              <h1 className="text-4xl font-bold text-gray-800">📢 {getTranslation(language, 'adminNotificationsPage')}</h1>
              <p className="text-gray-600 text-lg mt-2">{getTranslation(language, 'sendNotificationsToFarmers')}</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                ➕ {getTranslation(language, 'sendNotification')}
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 {getTranslation(language, 'broadcastMessage')}</h2>
              
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{getTranslation(language, 'targetUsers')}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="targetType"
                        value="all"
                        checked={notificationForm.targetType === 'all'}
                        onChange={(e) => handleInputChange('targetType', e.target.value)}
                        className="mr-2"
                      />
                      <span>All Farmers</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="targetType"
                        value="district"
                        checked={notificationForm.targetType === 'district'}
                        onChange={(e) => handleInputChange('targetType', e.target.value)}
                        className="mr-2"
                      />
                      <span>Specific District</span>
                    </label>
                  </div>
                </div>

                {notificationForm.targetType === 'district' && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Select District</label>
                    <select
                      value={notificationForm.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Pune">{getDistrictTranslation('Pune', language)}</option>
                      <option value="Nagpur">{getDistrictTranslation('Nagpur', language)}</option>
                      <option value="Ahmednagar">{getDistrictTranslation('Ahmednagar', language)}</option>
                      <option value="Solapur">{getDistrictTranslation('Solapur', language)}</option>
                      <option value="Aurangabad">{getDistrictTranslation('Aurangabad', language)}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Message</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Enter your notification message..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    📤 Send to {notificationForm.targetType === 'all' ? 'All Farmers' : notificationForm.district}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notification History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Notification History</h2>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      notif.type === 'warning' 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-blue-500 bg-blue-50'
                    } hover:shadow-md transition`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">{notif.message}</h3>
                        <div className="mt-2 flex gap-4 text-sm text-gray-600">
                          <span>📍 {notif.targetUsers}</span>
                          <span>📅 {notif.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-red-600 hover:text-red-700 font-semibold"
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No notifications sent yet</p>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">📊 Notification Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-purple-100 text-sm">Total Sent</p>
                <p className="text-3xl font-bold">{notifications.length}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">To All Farmers</p>
                <p className="text-3xl font-bold">{notifications.filter(n => n.targetUsers === 'All Farmers').length}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">District-wise</p>
                <p className="text-3xl font-bold">{notifications.filter(n => n.targetUsers !== 'All Farmers').length}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">This Month</p>
                <p className="text-3xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
