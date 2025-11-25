import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateConfirmPassword } from '../utils/validation';
import Nts_logo from '../assets/Nts_logo/NTSLOGO.png'; // Fixed path

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setError: setFieldError,
  } = useFormValidation(
    { email: '', password: '', confirmPassword: '' },
    {
      email: { required: true, email: true, fieldName: 'Email' },
      password: { required: true, password: true, minLength: 8, fieldName: 'Password' },
      confirmPassword: { required: true, fieldName: 'Confirm Password' },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
    if (confirmError) {
      setFieldError('confirmPassword', confirmError);
      return;
    }

    setIsLoading(true);

    try {
      await signUp(values.email, values.password);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.detail || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-900 p-4">
      {/* Main Card */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Left Side - Branding Panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white relative overflow-hidden">
          {/* Background Effects */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,.08) 40px, rgba(255,255,255,.08) 80px)`,
            }}
          />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30" />
          <div className="absolute top-20 -left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-20" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center ring-4 ring-white/20 overflow-hidden">
                <img
                  src={Nts_logo}
                  alt="HireGenix Logo"
                  className="h-12 w-12 object-contain scale-110"
                />
              </div>
              <div>
                <div className="text-3xl font-bold">HireGenix</div>
                <div className="text-sm tracking-widest text-white/70">Interview.AI</div>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="relative z-10 mt-16">
            <h1 className="text-6xl lg:text-6xl  leading-tight text-white drop-shadow-2xl">
              Join<br />HireGenix
            </h1>
            <p className="mt-6 text-blue-100 text-lg max-w-md leading-relaxed">
              Create your account and start streamlining your hiring with AI-powered interviews today.
            </p>
            
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex items-center justify-center p-8 lg:p-16 bg-gray-50">
          <div className="w-full max-w-md">

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
              <p className="mt-2 text-gray-600">Start your journey with HireGenix today</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="text-green-800 font-bold text-lg mb-2">Welcome to HireGenix!</div>
                <p className="text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <EmailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="name@company.com"
                    className={`w-full pl-12 pr-4 py-4 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                      errors.email && touched.email ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-4 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                      errors.password && touched.password ? 'border-red-400' : 'border-gray-200'
                    }`}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <LockResetIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-4 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                      errors.confirmPassword && touched.confirmPassword ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;