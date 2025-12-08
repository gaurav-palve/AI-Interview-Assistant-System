import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import authService from "../services/authService";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png";

function Signup() {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageTimeout, setMessageTimeout] = useState(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // VALIDATION
  const validateEmail = () => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
    return "";
  };

  const validateOtp = () => {
    if (!otp) return "OTP is required";
    if (!/^\d+$/.test(otp)) return "OTP must contain only numbers";
    return "";
  };

  // SHOW MESSAGES
  const showMessage = (message, isError = false) => {
    if (messageTimeout) clearTimeout(messageTimeout);

    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }

    const timeout = setTimeout(() => {
      setError("");
      setSuccess("");
      setMessageTimeout(null);
    }, 4000);

    setMessageTimeout(timeout);
  };

  // SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    const emailError = validateEmail();
    if (emailError) return showMessage(emailError, true);

    setIsLoading(true);
    try {
      const res = await authService.sendSignupOTP(email);
      showMessage(res.message || "OTP sent successfully!");
      setOtpSent(true);
    } catch (err) {
      showMessage(err.detail || "Failed to send OTP", true);
    } finally {
      setIsLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const otpError = validateOtp();
    if (otpError) return showMessage(otpError, true);

    setIsLoading(true);
    try {
      const res = await authService.verifySignupOTP(email, otp);
      showMessage(res.message || "OTP verified!");
      setOtpVerified(true);
    } catch (err) {
      showMessage(err.detail || "Failed to verify OTP", true);
    } finally {
      setIsLoading(false);
    }
  };

  // CREATE ACCOUNT
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!password) return showMessage("Password is required", true);
    if (password.length < 8)
      return showMessage("Password must be at least 8 characters", true);
    if (password !== confirmPassword)
      return showMessage("Passwords do not match", true);

    setIsLoading(true);
    try {
      await authService.createAccount(email, password, confirmPassword);
      showMessage("Account created successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showMessage(err.detail || "Failed to create account", true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="
      w-full min-h-screen 
      bg-gradient-to-br from-violet-100 via-white to-indigo-100
      flex items-center justify-center p-4 animate-pageFade
    "
    >
      {/* MAIN WRAPPER */}
      <div
        className="
        w-full max-w-4xl
        bg-white/85 backdrop-blur-xl 
        rounded-3xl shadow-2xl overflow-hidden 
        border border-white/40 
        grid grid-cols-1 lg:grid-cols-2
        animate-cardUp
      "
      >
        {/* LEFT PANEL (same as LOGIN) */}
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
            <div
              className="
              absolute inset-0 
              bg-gradient-to-b 
              from-violet-900/25 via-indigo-900/20 to-purple-900/25
              backdrop-blur-[1px]
            "
            ></div>

            <div className="relative z-10 w-full h-full flex flex-col pl-10 pr-6">
              {/* LOGO */}
              <div className="flex items-center gap-3 pt-6">
                <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-xl p-2">
                  <img src={Nts_logo} alt="Logo" className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-xl font-extrabold text-white drop-shadow-lg">
                    Neutrino
                  </p>
                  <p className="text-xs opacity-90 tracking-widest text-gray-200">
                    Interview.AI
                  </p>
                </div>
              </div>

              <div className="flex-grow" />

              {/* TEXT */}
              <div className="pb-20">
                <h1
                  className="
                  text-5xl font-extrabold 
                  bg-gradient-to-r from-violet-200 to-pink-200 
                  bg-clip-text text-transparent 
                  drop-shadow-xl
                "
                >
                  Join Us
                </h1>

                <p className="mt-5 text-indigo-100 text-sm leading-relaxed max-w-xs">
                  Create your Interview.AI account and streamline your hiring
                  process with intelligent automation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL – FORM */}
        <div
          className="
          flex items-center justify-center 
          p-10 bg-white animate-rightFade overflow-y-auto
        "
        >
          <div className="w-full max-w-xs">
            <h2
              className="
              text-3xl font-bold mb-1 
              bg-gradient-to-r from-violet-600 to-indigo-600 
              bg-clip-text text-transparent
            "
            >
              Create Account ✨
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Start your journey with Interview.AI
            </p>

            {/* ERROR */}
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                {success}
              </div>
            )}

            {/* STEP 1 — EMAIL */}
            {!otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg border-gray-200 focus:ring-2 focus:ring-violet-400/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="
                  w-full py-3 bg-gradient-to-r 
                  from-violet-600 to-indigo-600 
                  text-white rounded-lg font-medium shadow-md 
                  hover:shadow-xl hover:scale-[1.02] transition-all
                "
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            )}

            {/* STEP 2 — OTP */}
            {otpSent && !otpVerified && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400/50"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="flex-1 py-2.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition"
                  >
                    Change Email
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !otp}
                    className="
                    flex-1 py-2.5 bg-gradient-to-r 
                    from-violet-600 to-indigo-600 
                    text-white rounded-lg font-medium shadow-md 
                    hover:shadow-xl transition
                  "
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 — PASSWORD */}
            {otpVerified && (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                {/* PASSWORD */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 h-4 w-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <VisibilityOff className="h-4 w-4" />
                      ) : (
                        <Visibility className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockResetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 h-4 w-4" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400/50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff className="h-4 w-4" />
                      ) : (
                        <Visibility className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="
                  w-full py-3 bg-gradient-to-r 
                  from-violet-600 to-indigo-600 
                  text-white rounded-lg font-medium shadow-md 
                  hover:shadow-xl hover:scale-[1.02] 
                  transition
                "
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}

            {/* LOGIN LINK */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <Link
                to="/login"
                className="text-violet-600 ml-1 font-medium hover:underline"
              >
                Sign in
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
