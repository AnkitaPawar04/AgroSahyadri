import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import authStorage from '../../services/authStorage';

const ADMIN_EMAIL = 'ankita.pawarr19@gmail.com'; // Admin credentials (note: double 'r')

const LoginPage = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState('farmer'); // 'admin' or 'farmer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!email || !password || !firstName) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // Validate role-specific requirements
      if (selectedRole === 'admin' && email !== ADMIN_EMAIL) {
        setError(`Admin must use email: ${ADMIN_EMAIL}`);
        setLoading(false);
        return;
      }

      if (selectedRole === 'farmer' && email === ADMIN_EMAIL) {
        setError('This email is reserved for admin. Please use a different email for farmer role.');
        setLoading(false);
        return;
      }

      // Use selected role
      const userRole = selectedRole;

      // Register directly with backend (no Firebase for signup)
      try {
        console.log('Registering with backend:', { email, firstName, lastName, userRole, selectedRole });
        const response = await authAPI.register(email, password, firstName, lastName);
        
        if (!response.data || !response.data.access_token) {
          throw new Error('Invalid response from server');
        }

        // Store token and user info
        authStorage.setToken(response.data.access_token);
        authStorage.setUser({
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: userRole,
        });

        // Set admin flag if admin user
        if (userRole === 'admin') {
          localStorage.setItem('is_admin', 'true');
        } else {
          localStorage.removeItem('is_admin');
        }

        console.log(`Signup successful! Redirecting to ${userRole} dashboard`);
        
        // Redirect based on role
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (backendError) {
        console.error('Backend registration error:', backendError);
        const errorMsg = backendError.response?.data?.detail || 
                        backendError.response?.data?.message ||
                        backendError.message || 
                        getTranslation(language, 'failedCreateAccount');
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Signup Error:', err);
      const errorMsg = err.message || getTranslation(language, 'failedCreateAccount');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError(getTranslation(language, 'enterEmailPassword'));
        setLoading(false);
        return;
      }

      // Validate role-specific requirements for login
      if (selectedRole === 'admin' && email !== ADMIN_EMAIL) {
        setError(`Admin must use email: ${ADMIN_EMAIL}`);
        setLoading(false);
        return;
      }

      if (selectedRole === 'farmer' && email === ADMIN_EMAIL) {
        setError('To login as admin, select "Admin" role');
        setLoading(false);
        return;
      }

      // Use selected role
      const userRole = selectedRole;

      // Login with backend
      try {
        console.log('Logging in with email:', email, 'role:', userRole, 'selectedRole:', selectedRole);
        const response = await authAPI.login(email, password);
        
        if (!response.data || !response.data.access_token) {
          throw new Error('Invalid response from server');
        }

        // Store token and user info
        authStorage.setToken(response.data.access_token);
        authStorage.setUser({
          email: email,
          role: userRole,
        });

        // Set admin flag if admin user
        if (userRole === 'admin') {
          localStorage.setItem('is_admin', 'true');
        } else {
          localStorage.removeItem('is_admin');
        }

        console.log(`Login successful! Redirecting to ${userRole} dashboard`);
        navigate(userRole === 'admin' ? '/admin/dashboard' : '/dashboard');
      } catch (backendError) {
        console.error('Login error:', backendError);
        
        // Better error message extraction
        let errorMsg = 'Failed to login';
        
        if (backendError.response?.status === 401) {
          errorMsg = 'Invalid email or password';
        } else if (backendError.response?.data?.detail) {
          errorMsg = backendError.response.data.detail;
        } else if (backendError.response?.data?.message) {
          errorMsg = backendError.response.data.message;
        } else if (backendError.message === 'Network Error') {
          errorMsg = 'Network error: Backend server not responding. Make sure the server is running on http://localhost:8000';
        } else if (backendError.code === 'ECONNABORTED') {
          errorMsg = 'Request timeout: Server took too long to respond';
        } else if (backendError.message) {
          errorMsg = backendError.message;
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Login Error:', err);
      const errorMsg = err.message || 'Invalid email or password';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:bg-white flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex-col justify-between p-12 text-white min-h-screen">
        {/* Top Section */}
        <div>
          {/* Logo & Title */}
          <div className="mb-10">
            <h1 className="text-6xl font-bold mb-3">🌾 AgroSahyadri</h1>
            <p className="text-2xl font-semibold text-green-100">
              Empowering Maharashtra Farmers with AI
            </p>
            <p className="text-green-200 text-lg mt-2">
              {getTranslation(language, 'smartCropDescription')}
            </p>
          </div>

          {/* Feature Cards Preview */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {/* Weather Card */}
            <div className="bg-white bg-opacity-15 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-25 transition">
              <p className="text-green-100 text-sm font-semibold mb-2">🌤️ Weather</p>
              <p className="text-white text-2xl font-bold">32°C</p>
              <p className="text-green-100 text-xs mt-1">Moderate Rain</p>
            </div>

            {/* Soil Info Card */}
            <div className="bg-white bg-opacity-15 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-25 transition">
              <p className="text-green-100 text-sm font-semibold mb-2">🌱 Soil Health</p>
              <p className="text-white text-2xl font-bold">pH: 6.8</p>
              <p className="text-green-100 text-xs mt-1">Optimal State</p>
            </div>

            {/* Crop Monitoring Card */}
            <div className="bg-white bg-opacity-15 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-25 transition">
              <p className="text-green-100 text-sm font-semibold mb-2">🥬 Crops</p>
              <p className="text-white text-2xl font-bold">4 Active</p>
              <p className="text-green-100 text-xs mt-1">Healthy Growth</p>
            </div>

            {/* Disease Detection Card */}
            <div className="bg-white bg-opacity-15 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-25 transition">
              <p className="text-green-100 text-sm font-semibold mb-2">🔍 Detection</p>
              <p className="text-white text-2xl font-bold">Safe</p>
              <p className="text-green-100 text-xs mt-1">No Issues Found</p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Features & Call to Action */}
        <div>
          {/* Features List */}
          <div className="mb-10 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold">{getTranslation(language, 'smartCropRecommendations')}</p>
                <p className="text-green-100 text-sm">AI analyzes soil & weather for best crops</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold">Real-time Disease Detection</p>
                <p className="text-green-100 text-sm">Computer vision identifies crop diseases early</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold">Weather & Soil Analytics</p>
                <p className="text-green-100 text-sm">Live data tracking for informed decisions</p>
              </div>
            </div>
          </div>

          {/* Call to Action Button & Footer */}
          <div className="border-t border-green-500 pt-6">
            <p className="text-green-100 text-sm mb-4">
              {getTranslation(language, 'joinFarmers')}
            </p>
            <button className="w-full bg-white text-green-700 font-bold py-3 rounded-xl hover:bg-green-50 transition mb-4">
              Learn More →
            </button>
            <p className="text-xs text-green-200 text-center">
              Available as Web App & Mobile App
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile Hero Section */}
          <div className="lg:hidden bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2">🌾 AgroSahyadri</h1>
            <p className="text-lg font-semibold text-green-100 mb-4">
              Empowering Maharashtra Farmers with AI
            </p>
            <p className="text-green-100 text-sm mb-6">
              {getTranslation(language, 'smartCropDescription')}
            </p>
          </div>

          {/* Tab Switch */}
          <div className="flex gap-3 mb-8 bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => {
                setIsSignup(false);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
                !isSignup
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsSignup(true);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
                isSignup
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Role Selection Toggle */}
          <div className="flex gap-3 mb-6 bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => {
                setSelectedRole('admin');
                setError('');
                if (selectedRole === 'farmer') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              👨‍💼 Admin
            </button>
            <button
              onClick={() => {
                setSelectedRole('farmer');
                setError('');
                if (selectedRole === 'admin') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
                selectedRole === 'farmer'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              👨‍🌾 Farmer
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm">
              <p className="font-bold text-sm">⚠️ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={isSignup ? handleEmailSignup : handleEmailLogin}>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isSignup 
                  ? (selectedRole === 'admin' ? '👨‍💼 Create Admin Account' : '👨‍🌾 Create Farmer Account')
                  : (selectedRole === 'admin' ? '👨‍💼 Admin Login' : '👨‍🌾 Farmer Login')
                }
              </h2>
              <p className="text-gray-600 text-sm mb-8">
                {isSignup 
                  ? getTranslation(language, 'joinGetRecommendations')
                  : 'Login to access your farm dashboard and insights'}
              </p>

              {isSignup && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 transition"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {isSignup && (
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 Use at least 8 characters with uppercase, lowercase, and numbers
                  </p>
                )}
              </div>

              {isSignup && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 transition"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-4"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    {isSignup ? 'Creating Account...' : 'Logging in...'}
                  </>
                ) : (
                  isSignup ? '✓ Create Account' : '🚀 Login'
                )}
              </button>

              {/* Divider - Only show for email login */}
              {/* Google button removed - Firebase deprioritized */}

            </div>

            {/* Trust Indicators */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                🔒 Secure & Encrypted | ✓ Your data is protected
              </p>
            </div>
          </form>

          {/* Admin Login Link */}
          {!isSignup && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Are you an admin?</p>
              <a 
                href="/admin/login"
                className="text-green-600 hover:text-green-700 font-semibold text-sm transition"
              >
                → Go to Admin Login
              </a>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600 mb-1">
              💚 Built by Farmers, for Maharashtra Farmers
            </p>
            <p className="text-xs text-gray-500">
              Available on Web & Mobile • Privacy Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
