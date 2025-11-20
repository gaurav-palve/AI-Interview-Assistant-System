import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateEmail, validateRequired } from '../utils/validation';
 
/**
 * Login page component
 */
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
 
  // Form validation
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: {
        required: true,
        email: true,
        fieldName: 'Email'
      },
      password: {
        required: true,
        fieldName: 'Password'
      }
    }
  );
 
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
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
    <div className="h-screen w-full grid place-items-center py-12 px-4 sm:px-6 lg:px-8 page-transition relative overflow-hidden">
      {/* Simple Animated Background - Only Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-primary-100/50 to-secondary-50 animate-gradient-shift"></div>
     
      {/* Content */}
      <div className="relative z-10 max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-center text-3xl font-bold mb-6 text-gray-900">Login</h2>
       
        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <Link to="/login" className="flex-1 text-center py-2 px-4 rounded-md font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm transition-all">
            Login
          </Link>
          <Link to="/signup" className="flex-1 text-center py-2 px-4 rounded-md font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Signup
          </Link>
        </div>
 
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
 
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EmailIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.email && touched.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.email}
              </p>
            )}
          </div>
         
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.password && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOff className="h-5 w-5" />
                ) : (
                  <Visibility className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.password}
              </p>
            )}
          </div>
 
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
 
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-primary-700 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
 
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
                Signup now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
 
export default Login;
