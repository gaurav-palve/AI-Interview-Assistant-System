import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Email as EmailIcon } from '@mui/icons-material';
import authService from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timerDismiss;
    let timerNavigate;
    if (showSuccess) {
      // auto-dismiss success after 6 seconds
      timerDismiss = setTimeout(() => setShowSuccess(false), 6000);
      // auto-navigate to reset page after 2.5 seconds
      if (email) {
        timerNavigate = setTimeout(() => navigate('/reset-password', { state: { email } }), 2500);
      }
    }
    return () => {
      clearTimeout(timerDismiss);
      clearTimeout(timerNavigate);
    };
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
    <div className="h-screen w-full grid place-items-center py-12 px-4 sm:px-6 lg:px-8 page-transition">
      <div className="max-w-sm w-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-[0_10px_25px_-5px_rgba(75,85,99,0.3)] p-6">
        <h2 className="text-center text-2xl font-bold mb-4 text-gray-800 animate-fadeIn">Forgot Password</h2>
        
        {/* Tab Navigation */}
        <div className="tab-nav mb-5 bg-gray-100 border border-gray-300">
          <Link to="/login" className="tab-item tab-item-inactive text-gray-700 hover:text-gray-900 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            Login
          </Link>
          <Link to="/forgot-password" className="tab-item tab-item-active animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            Forgot Password
          </Link>
        </div>

        {status && status !== 'sending' && !showSuccess && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-red-700">{String(status)}</p>
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

          <div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn w-full py-2 animate-slideIn bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full hover:from-blue-600 hover:to-cyan-500 shadow-md"
              style={{ animationDelay: '0.4s' }}
            >
              {status === 'sending' ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Send OTP"
              )}
            </button>
          </div>
          
          {showSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded animate-fadeIn">
              <div className="flex flex-col gap-2">
                <div>
                  <strong>OTP sent successfully</strong>
                  <div className="text-sm">An OTP was sent to <span className="font-medium">{email}</span>. Check your inbox (or spam).</div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-sm"
                    onClick={() => setShowSuccess(false)}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded text-sm hover:from-blue-600 hover:to-cyan-500 shadow-sm"
                    onClick={() => navigate('/reset-password', { state: { email } })}
                  >
                    Go to Reset
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
