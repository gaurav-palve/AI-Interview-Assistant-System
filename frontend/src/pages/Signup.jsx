import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { useFormValidation } from "../hooks/useFormValidation";
import { validateConfirmPassword } from "../utils/validation";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png";

function Signup() {
  const navigate = useNavigate();
  
  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI control states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageTimeout, setMessageTimeout] = useState(null);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation
  const validateEmail = () => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address";
    return "";
  };
  
  const validateOtp = () => {
    if (!otp) return "OTP is required";
    if (!/^\d+$/.test(otp)) return "OTP should contain only numbers";
    return "";
  };

  // Function to show messages with auto-dismiss
  const showMessage = (message, isError = false) => {
    // Clear any existing timeouts
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    // Set the appropriate message
    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    
    // Set a timeout to clear the message after 3 seconds
    const timeout = setTimeout(() => {
      if (isError) {
        setError("");
      } else {
        setSuccess("");
      }
      setMessageTimeout(null);
    }, 5000);
    
    // Save the timeout ID
    setMessageTimeout(timeout);
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailError = validateEmail();
    if (emailError) {
      showMessage(emailError, true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authService.sendSignupOTP(email);
      showMessage(result.message || "OTP sent successfully!");
      setOtpSent(true);
    } catch (err) {
      showMessage(err.detail || "Failed to send OTP. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Validate OTP
    const otpError = validateOtp();
    if (otpError) {
      showMessage(otpError, true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const verifyResult = await authService.verifySignupOTP(email, otp);
      showMessage(verifyResult.message || "OTP verified successfully!");
      setOtpVerified(true);
    } catch (err) {
      showMessage(err.detail || "Failed to verify OTP. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Create account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (!password) {
      showMessage("Password is required", true);
      return;
    }
    
    if (password.length < 8) {
      showMessage("Password must be at least 8 characters", true);
      return;
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      showMessage("Passwords do not match", true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authService.createAccount(email, password, confirmPassword);
      showMessage("Account created successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showMessage(err.detail || "Failed to create account. Please try again.", true);
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
            className="relative rounded-2xl overflow-hidden shadow-lg w-full h-full"
            style={{
              backgroundImage: `url(${LoginBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b 
                            from-violet-900/25 via-indigo-900/15 to-purple-900/25 
                            backdrop-blur-[1px]" />

            {/* LOGO FIXED AT TOP */}
            <div className="relative z-10 flex items-center gap-3 px-8 pt-8">
              <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-xl p-2">
                <img src={Nts_logo} alt="Logo" className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-white drop-shadow-lg">Neutrino</p>
                <p className="text-xs opacity-90 tracking-widest text-gray-200">Interview.AI</p>
              </div>
            </div>

            {/* CENTER CONTENT */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center px-10 pb-20">
              <h1 className="
                text-5xl font-extrabold 
                bg-gradient-to-r from-violet-200 to-pink-200 
                bg-clip-text text-transparent 
                drop-shadow-xl
              ">
                Join HireGenix
              </h1>

              <p className="mt-5 text-indigo-100 text-sm leading-relaxed max-w-xs">
                Create your account and start streamlining hiring with
                AI-powered interviews.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="flex items-center justify-center p-10 bg-white animate-rightFade overflow-visible">
          <div className="w-full max-w-xs">

            <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Create Your Account
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Start your journey with HireGenix
            </p>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
                <div className="font-semibold">Welcome!</div>
                <p className="text-xs mt-1">{success}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="name@company.com"
                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg 
                      focus:ring-2 focus:ring-violet-400/50 transition-all
                      ${errors.email && touched.email ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>

                {/* EMAIL ERROR */}
                {errors.email && touched.email && (
                  <p className="text-xs text-red-600 mt-2 pl-1 animate-pulse">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg 
                      focus:ring-2 focus:ring-violet-400/50 transition-all
                      ${errors.password && touched.password ? "border-red-400" : "border-gray-200"}`}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setOtpVerified(false);
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700
                      rounded-base font-medium hover:bg-gray-200 transition disabled:opacity-60"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>

                {/* PASSWORD ERROR */}
                {errors.password && touched.password && (
                  <p className="text-xs text-red-600 mt-2 pl-1 animate-pulse">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                <div className="relative">
                  <LockResetIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg 
                      focus:ring-2 focus:ring-violet-400/50 transition-all
                      ${errors.confirmPassword && touched.confirmPassword ? "border-red-400" : "border-gray-200"}`}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white
                      rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>

                {/* CONFIRM PASSWORD ERROR */}
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-xs text-red-600 mt-2 pl-1 animate-pulse">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3 
                  bg-gradient-to-r from-violet-600 to-indigo-600 text-white 
                  rounded-lg font-medium shadow-md 
                  hover:shadow-xl hover:scale-[1.02] 
                  transition-all
                "
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* ALREADY HAVE ACCOUNT */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <Link to="/login" className="text-violet-600 ml-1 hover:underline font-medium">
                Sign in here
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

export default Signup;


