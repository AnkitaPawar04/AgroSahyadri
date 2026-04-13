import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import LoginPage from './pages/farmers/LoginPage';
import DashboardPage from './pages/farmers/DashboardPage';
import CropRecommendationPage from './pages/farmers/CropRecommendationPage';
import WeatherPage from './pages/farmers/WeatherPage';
import ProfilePage from './pages/farmers/ProfilePage';
import SettingsPage from './pages/farmers/SettingsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFarmerManagementPage from './pages/admin/AdminFarmerManagementPage';
import AdminCropManagementPage from './pages/admin/AdminCropManagementPage';
import AdminSoilManagementPage from './pages/admin/AdminSoilManagementPage';
import AdminWeatherAlertsPage from './pages/admin/AdminWeatherAlertsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import authStorage from './services/authStorage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  if (!authStorage.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  if (!localStorage.getItem('is_admin')) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Farmer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage onNavigate={handleNavigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-recommendation"
            element={
              <ProtectedRoute>
                <CropRecommendationPage onNavigate={handleNavigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <WeatherPage onNavigate={handleNavigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage onNavigate={handleNavigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage onNavigate={handleNavigate} />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/farmers"
            element={
              <AdminRoute>
                <AdminFarmerManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crops"
            element={
              <AdminRoute>
                <AdminCropManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/soil"
            element={
              <AdminRoute>
                <AdminSoilManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/weather"
            element={
              <AdminRoute>
                <AdminWeatherAlertsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotificationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <AdminProfilePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
