import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useFormValidation } from '../hooks/useFormValidation';
import Nts_logo from '../assets/Nts_logo/NTSLOGO.png';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: { required: true, email: true, fieldName: 'Email' },
      password: { required: true, fieldName: 'Password' },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
 
    // Validate form
    if (!validate()) {
      return;
    }
 
    setIsLoading(true);
 
    try {
      await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-300 to-indigo-700 p-4">
      {/* Main Card - Fixed size container that doesn't scale with zoom */}
      <div style={{ width: '900px', maxWidth: '100%', height: 'auto' }} className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left Side - Welcome Panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white relative overflow-hidden">
          {/* Subtle Diagonal Lines */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,.08) 40px, rgba(255,255,255,.08) 80px)`,
            }}
          />

          {/* Glowing Orbs */}
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30" />
          <div className="absolute top-20 -left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-20" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h- h-14 bg-white rounded-full flex items-center justify-center shadow-xl p-2">
              <img
                src={Nts_logo}
                alt="NTS Logo"
                className="h-10 w-10 object-contain rounded-sm" // rounded-sm for subtle polish
              />
            </div>
              <div>
                <div className="text-2xl font-bold">Neutrino</div>
                <div className="text-sm tracking-widest opacity-80">Interview.AI</div>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="relative z-10 mt-16 ">
            <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-2xl">
              <br />HireGenix
            </h1>
            <p className="mt-6 text-blue-100 text-lg max-w-sm leading-relaxed">
              AI powered interview assistant to streamline your hiring process and find the best talent faster.
            </p>
            <button className="mt-10 px-8 py-4 bg-white text-blue-700 font-bold rounded-full hover:bg-gray-100 transition shadow-lg">
              View more
            </button>
          </div>

          <div className="relative z-10 mt-auto">
            {/* Optional footer text can go here */}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-8 lg:p-12 bg-gray-50">
          <div style={{ width: '320px', maxWidth: '100%', height: 'auto' }}>
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative">
                  <EmailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="name@mail.com"
                    className={`w-full pl-12 pr-4 py-4 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                      errors.email && touched.email
                        ? 'border-red-400'
                        : 'border-gray-200'
                    }`}
                    style={{ height: '50px' }}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-4 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                      errors.password && touched.password
                        ? 'border-red-400'
                        : 'border-gray-200'
                    }`}
                    style={{ height: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-4 text-sm text-gray-500">Not a member yet?</span>
              </div>
            </div>

            {/* Sign Up Button */}
            <Link to="/signup" className="block">
              <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition">
                Sign up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;