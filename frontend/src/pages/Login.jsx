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
import LoginBg from '../assets/login_bg.png';
import { NAV_ITEMS } from "../config/navigationConfig";
import { getFirstAllowedRoute } from "../utils/getFirstAllowedRoute";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = '/dashboard';

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

      const permissions = JSON.parse(
        localStorage.getItem("auth_permissions") || "[]"
      );

      const redirectTo = getFirstAllowedRoute(permissions, NAV_ITEMS);

      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(err.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-100 via-white to-indigo-100
                    flex items-center justify-center p-4 animate-pageFade">

      {/* MAIN CARD */}
      <div className="
        w-full max-w-4xl
        bg-white/85 backdrop-blur-xl 
        rounded-3xl shadow-2xl overflow-hidden 
        border border-white/40 
        grid grid-cols-1 lg:grid-cols-2
        animate-cardUp
      ">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex relative p-4">

          <div
            className="
              relative rounded-2xl overflow-hidden shadow-lg 
              w-full h-full flex flex-col
            "
            style={{
              backgroundImage: `url(${LoginBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* OVERLAY */}
            <div className="
              absolute inset-0 
              bg-gradient-to-b 
              from-violet-900/25 via-indigo-900/20 to-purple-900/25
              backdrop-blur-[1px]
            "></div>

            {/* LEFT CONTENT */}
            <div className="relative z-10 w-full h-full flex flex-col pl-10 pr-6">

              {/* LOGO AT TOP */}
              <div className="flex items-center gap-3 pt-6">
                <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-xl p-2">
                  <img src={Nts_logo} alt="NTS Logo" className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-xl font-extrabold text-white drop-shadow-lg">Neutrino</p>
                  <p className="text-xs opacity-90 tracking-widest text-gray-200">Hirepool.AI</p>
                </div>
              </div>

              {/* SPACER TO PUSH TO CENTER */}
              <div className="flex-grow" />

              {/* HIREGENIX SECTION CENTERED VERTICALLY */}
              <div className="pb-20">
                <h1 className="
                  text-5xl font-extrabold 
                  bg-gradient-to-r from-violet-200 to-pink-200 
                  bg-clip-text text-transparent 
                  drop-shadow-xl
                ">
                  HireGenix
                </h1>

                <p className="mt-5 text-indigo-100 text-sm leading-relaxed max-w-xs">
                  AI-powered interview assistant to streamline your hiring workflow
                  using next-gen intelligence.
                </p>

                {/* BUTTON */}
                <button className="
                  mt-6 px-5 py-2 
                  bg-white/90 text-indigo-700 text-sm 
                  font-semibold rounded-full 
                  hover:bg-white hover:shadow-xl 
                  transition-all duration-300 w-fit
                ">
                  View more
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="flex items-center justify-center p-10 bg-white animate-rightFade overflow-visible">
          <div className="w-full max-w-xs">

            <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back 👋
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Login to access your HireGenix dashboard
            </p>

            {/* API ERROR */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div className="group">
                <label className="block text-xs font-semibold mb-1">Email</label>

                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="example@mail.com"
                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg 
                      focus:ring-2 focus:ring-violet-400/50 transition-all
                      ${errors.email && touched.email ? 'border-red-400' : 'border-gray-200'}
                    `}
                  />
                </div>

                {errors.email && touched.email && (
                  <p className="text-xs text-red-600 mt-2 pl-1 animate-pulse">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="group">
                <label className="block text-xs font-semibold mb-1">Password</label>

                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg
                      focus:ring-2 focus:ring-violet-400/50 transition-all
                      ${errors.password && touched.password ? 'border-red-400' : 'border-gray-200'}
                    `}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>

                {errors.password && touched.password && (
                  <p className="text-xs text-red-600 mt-2 pl-1 animate-pulse">{errors.password}</p>
                )}
              </div>

              {/* REMEMBER + FORGOT */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span>Remember me</span>
                </label>

                <Link to="/forgot-password" className="text-violet-600 hover:underline">
                  Forgot?
                </Link>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3 
                  bg-gradient-to-r from-violet-600 to-indigo-600 text-white 
                  rounded-lg font-medium shadow-md 
                  hover:shadow-xl hover:scale-[1.02] 
                  transition-all duration-300
                "
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* SIGNUP LINK */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Not a member?</span>
              <Link to="/signup" className="text-violet-600 ml-1 font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes pageFade { 
          from {opacity:0; transform:translateY(20px);} 
          to {opacity:1; transform:translateY(0);} 
        }
        .animate-pageFade { animation: pageFade .7s ease-out; }

        @keyframes cardUp { 
          from {opacity:0; transform:scale(.95);} 
          to {opacity:1; transform:scale(1);} 
        }
        .animate-cardUp { animation: cardUp .7s ease-out; }

        @keyframes rightFade { 
          from {opacity:0; transform:translateX(25px);} 
          to {opacity:1; transform:translateX(0);} 
        }
        .animate-rightFade { animation: rightFade .8s ease-out .2s forwards; opacity:0; }
      `}</style>
    </div>
  );
}

export default Login;