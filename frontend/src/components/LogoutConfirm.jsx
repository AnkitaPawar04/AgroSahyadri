import React from 'react';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../utils/i18n';

const LogoutConfirm = ({ isOpen, onConfirm, onCancel }) => {
  const { language } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-96 max-w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {getTranslation(language, 'confirmLogout')}
        </h2>
        <p className="text-gray-600 mb-6">
          {getTranslation(language, 'areYouSure')}
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            {getTranslation(language, 'no')}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            {getTranslation(language, 'yes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirm;
