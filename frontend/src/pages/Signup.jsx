import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Email as EmailIcon, Lock as LockIcon, LockReset as LockResetIcon } from '@mui/icons-material';

/**
 * Signup page component
 */
function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password);
      setSuccess('Account created successfully! You can now sign in.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.detail || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full grid place-items-center py-12 px-4 sm:px-6 lg:px-8 page-transition">
      <div className="max-w-sm w-full bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-[0_10px_25px_-5px_rgba(75,85,99,0.3)] p-6">
        <h2 className="text-center text-2xl font-bold mb-4 text-gray-800 animate-fadeIn">Signup</h2>
        
        {/* Tab Navigation */}
        <div className="tab-nav mb-5 bg-gray-100 border border-gray-300">
          <Link to="/login" className="tab-item tab-item-inactive text-gray-700 hover:text-gray-900 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            Login
          </Link>
          <Link to="/signup" className="tab-item tab-item-active animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            Signup
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-green-700">{success}</p>
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
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10"
              style={{ animationDelay: '0.3s' }}
              placeholder="Email Address"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10"
              style={{ animationDelay: '0.4s' }}
              placeholder="Password"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockResetIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input bg-white border-gray-300 text-gray-800 animate-slideIn pl-10"
              style={{ animationDelay: '0.5s' }}
              placeholder="Confirm Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn w-full py-2 animate-slideIn bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full hover:from-blue-600 hover:to-cyan-500 shadow-md"
              style={{ animationDelay: '0.6s' }}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Signup"
              )}
            </button>
          </div>

          <div className="text-center animate-fadeIn" style={{ animationDelay: '0.7s' }}>
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Login now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;