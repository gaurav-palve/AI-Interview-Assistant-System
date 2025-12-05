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
import authService from "../services/authService";
import HireGenixLogo from "../../public/HireGenix_logo.svg";
import LoginBg from "../assets/login_bg.png"; // SAME LEFT-SIDE IMAGE AS LOGIN

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
    <div className="w-full h-screen bg-[#f7f8fc] flex items-center justify-center">

      {/* FULL WRAPPER */}
      <div className="w-[95%] max-w-5xl h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL (same as Login) */}
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white relative"
          style={{
            backgroundImage: `url(${LoginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

          {/* LOGO SECTION */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl p-2">
              <img
                src={HireGenixLogo}
                alt="HireGenix Logo"
                className="h-8 w-8 object-contain rounded-sm"
              />
            </div>
            <div>
              <div className="text-xl font-bold">HireGenix</div>
              <div className="text-xs tracking-widest opacity-90">AI Interviews</div>
            </div>
          </div>

          {/* TEXT CONTENT */}
          <div className="relative z-10 mt-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold drop-shadow-lg text-gray-200">
              Join HireGenix
            </h1>

            <p className="mt-4 text-blue-100 text-sm max-w-xs drop-shadow-md leading-relaxed">
              Create your account and start streamlining hiring with
              AI-powered interviews.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL – FORM */}
        <div className="flex items-center justify-center p-10 bg-white overflow-y-auto">
          <div className="w-full" style={{ maxWidth: "330px" }}>

            {/* HEADER SECTION WITH SIGN-UP STATUS */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                Create Your Account
              </h2>
              
            </div>
              {/* Error Message - Smaller and more compact */}
              {error && (
                <div className="mb-2 py-1.5 px-2 bg-red-50 border-l-2 border-red-400 rounded-base text-xs text-red-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                  {error}
                </div>
              )}
  
              {/* Success Message - Smaller and more compact */}
              {success && (
                <div className="mb-2 py-1.5 px-2 bg-green-50 border-l-2 border-green-400 rounded-sm text-xs text-green-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  {success}
                </div>
              )}

            {/* FORM - STEP 1: EMAIL */}
            {!otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-base font-semibold mb-1">Enter Email</label>
                  <div className="relative">
                    <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                  </div>
                </div>

                {/* SEND OTP BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white
                    rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {/* FORM - STEP 2: OTP VERIFICATION */}
            {otpSent && !otpVerified && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-base font-semibold">Enter OTP</label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  {/* CHANGE EMAIL BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700
                      rounded-base font-medium hover:bg-gray-200 transition disabled:opacity-60"
                  >
                    Change Email
                  </button>

                  {/* VERIFY OTP BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoading || !otp}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white
                      rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* FORM - STEP 3: CREATE PASSWORD */}
            {otpVerified && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                {/* PASSWORD */}
                <div>
                  <label className="block text-base font-semibold mb-1">Password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <VisibilityOff className="h-4 w-4" /> : <Visibility className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-base font-semibold mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockResetIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <VisibilityOff className="h-4 w-4" /> : <Visibility className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {/* BACK BUTTON */}
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
                    Back
                  </button>

                  {/* CREATE ACCOUNT BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white
                      rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
                  >
                    {isLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}

            {/* Already have account */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <Link to="/login" className="text-blue-600 ml-1 font-medium">
                Sign in here
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;

