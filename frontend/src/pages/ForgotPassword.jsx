import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Email as EmailIcon } from '@mui/icons-material';
import authService from '../services/authService';
import Nts_logo from '../assets/Nts_logo/NTSLOGO.png'; // Fixed path (adjust if needed)

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await authService.forgotPassword(email);
      setStatus('sent');
      setShowSuccess(true);
    } catch (err) {
      setStatus(err?.detail || 'An error occurred while sending OTP');
      setShowSuccess(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-900 p-4">
      {/* Main Container */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Left Side - Branding (Same as Login) */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-20"
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
              Reset<br />Password
            </h1>
            <p className="mt-6 text-primary-100 text-lg max-w-md leading-relaxed">
              Enter your email and we’ll send you a secure OTP to reset your password.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center p-8 lg:p-16 bg-gray-50">
          <div className="w-full max-w-md">

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="mt-2 text-gray-600">No worries. We'll help you get back in.</p>
            </div>

            {/* Error */}
            {status && !showSuccess && status !== 'sending' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {status}
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="text-green-800 font-semibold text-lg mb-2">
                  OTP Sent Successfully!
                </div>
                <p className="text-green-700">
                  Check your email <span className="font-medium">{email}</span> for the OTP.
                </p>
                <p className="text-sm text-green-600 mt-3">
                  Redirecting you to reset page in 3 seconds...
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
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

              <button
                type="submit"
                disabled={status === 'sending' || !email}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}