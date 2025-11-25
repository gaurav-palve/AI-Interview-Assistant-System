import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  VpnKey as PinIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import authService from '../services/authService';
import Nts_logo from '../assets/Nts_logo/NTSLOGO.png'; // Fixed path

export default function ResetPassword() {
  const { state } = useLocation();
  const prefilledEmail = state?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      await authService.resetPassword({
        email,
        otp: Number(otp),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setStatus('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus(err?.detail || 'Failed to reset password. Please check OTP.');
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
          {/* Background Pattern */}
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
            <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-2xl">
              Create New<br />Password
            </h1>
            <p className="mt-6 text-blue-100 text-lg max-w-md leading-relaxed">
              Your new password must be different from previously used passwords.
            </p>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="flex items-center justify-center p-8 lg:p-16 bg-gray-50">
          <div className="w-full max-w-md">

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Reset Your Password</h2>
              <p className="mt-2 text-gray-600">Enter the OTP and set a new secure password</p>
            </div>

            {/* Error Message */}
            {status && !status.includes('success') && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {status}
              </div>
            )}

            {/* Success Message */}
            {status === 'success' && (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="text-green-800 font-bold text-lg mb-2">
                  Password Changed Successfully!
                </div>
                <p className="text-green-700">
                  You can now log in with your new password.
                </p>
                <p className="text-sm text-green-600 mt-3">
                  Redirecting to login...
                </p>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                <div className="relative">
                  <PinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition font-mono text-lg tracking-widest text-center"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !otp || !newPassword || !confirmPassword}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>

            {/* Back Links */}
            <div className="mt-8 text-center text-sm text-gray-600 space-y-2">
              <p>
                Didn’t receive OTP?{' '}
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Resend OTP
                </Link>
              </p>
              <p>
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  ← Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}