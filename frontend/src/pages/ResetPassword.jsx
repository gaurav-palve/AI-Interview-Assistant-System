import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Email as EmailIcon, Lock as LockIcon, VpnKey as PinIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../services/authService';

export default function ResetPassword() {
  const loc = useLocation();
  const prefilledEmail = loc.state?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }
    setStatus('submitting');
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        otp: Number(otp),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStatus('success');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setStatus(err?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full grid place-items-center py-12 px-4 sm:px-6 lg:px-8 page-transition" style={{ background: 'linear-gradient(135deg, #d7d8f6, #f8dce5)' }}>
      <div className="max-w-sm w-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-[0_10px_25px_-5px_rgba(75,85,99,0.3)] p-6">
        <h2 className="text-center text-2xl font-bold mb-4 text-gray-800 animate-fadeIn">Reset Password</h2>
        
        {/* Tab Navigation */}
        <div className="tab-nav mb-5 bg-gray-100 border border-gray-300">
          <Link to="/login" className="tab-item tab-item-inactive text-gray-700 hover:text-gray-900 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            Login
          </Link>
          <Link to="/reset-password" className="tab-item tab-item-active animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            Reset Password
          </Link>
        </div>

        {status && status !== 'submitting' && status !== 'success' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-red-700">{String(status)}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-green-700">Password reset successful! Redirecting to login...</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EmailIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10 w-full"
              style={{ animationDelay: '0.3s' }}
              placeholder="Email Address"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10 w-full"
              style={{ animationDelay: '0.4s' }}
              placeholder="OTP Code"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="new-password"
              name="new-password"
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10 w-full pr-10"
              style={{ animationDelay: '0.5s' }}
              placeholder="New Password"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOff className="h-5 w-5" />
                ) : (
                  <Visibility className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10 w-full pr-10"
              style={{ animationDelay: '0.6s' }}
              placeholder="Confirm Password"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <VisibilityOff className="h-5 w-5" />
                ) : (
                  <Visibility className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn w-full py-2 animate-slideIn bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full hover:from-blue-600 hover:to-cyan-500 shadow-md"
              style={{ animationDelay: '0.7s' }}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
          
          <div className="text-center animate-fadeIn" style={{ animationDelay: '0.8s' }}>
            <p className="text-sm text-gray-600">
              No OTP received?{' '}
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
                Request again
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
