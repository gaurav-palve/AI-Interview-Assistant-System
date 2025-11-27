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
import LoginBg from '../assets/login_bg.png'; // ← your left-side image

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
    if (!validate()) return;
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
    <div className="w-full h-screen bg-[#f7f8fc] flex items-center justify-center">

      {/* WRAPPER CARD */}
      <div className="w-[95%] max-w-5xl h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white relative"
          style={{
            backgroundImage: `url(${LoginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay for better readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

          {/* TOP LOGO */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl p-2">
              <img
                src={Nts_logo}
                alt="NTS Logo"
                className="h-8 w-8 object-contain rounded-sm"
              />
            </div>
            <div>
              <div className="text-xl font-bold">Neutrino</div>
              <div className="text-xs tracking-widest opacity-90">Interview.AI</div>
            </div>
          </div>

          {/* MAIN HEADING */}
          <div className="relative z-10 mt-10">
            {/* <h1 className="text-4xl lg:text-5xl font-extrabold drop-shadow-lg">
              HireGenix
            </h1> */}
            <h1 className="text-4xl lg:text-5xl font-extrabold drop-shadow-lg text-gray-200">
              HireGenix
            </h1>
            <p className="mt-4 text-blue-100 text-sm max-w-xs drop-shadow-md">
              AI powered interview assistant to streamline your hiring process.
            </p>
            <button className="mt-6 px-6 py-2.5 bg-white text-blue-700 text-sm font-semibold rounded-full hover:bg-gray-100 transition shadow-md">
              View more
            </button>
          </div>
        </div>


        {/* RIGHT LOGIN PANEL */}
        <div className="flex items-center justify-center p-10 bg-white">
          <div className="w-full" style={{ maxWidth: '330px' }}>

            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Welcome Back 👋
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Login to continue using HireGenix
            </p>

            {/* ERROR */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="example@mail.com"
                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg focus:outline-none 
                      focus:ring-2 focus:ring-blue-400/40 ${
                        errors.email && touched.email ? 'border-red-400' : 'border-gray-200'
                      }`}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg focus:outline-none 
                      focus:ring-2 focus:ring-blue-400/40 ${
                        errors.password && touched.password ? 'border-red-400' : 'border-gray-200'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <VisibilityOff className="h-4 w-4" /> : <Visibility className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* REMEMBER + FORGOT */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-blue-600">
                  Forgot?
                </Link>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                rounded-lg font-medium shadow-md hover:shadow-lg transition"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

            </form>

            {/* SIGNUP */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Not a member?</span>
              <Link to="/signup" className="text-blue-600 ml-1 font-medium">
                Sign up
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
