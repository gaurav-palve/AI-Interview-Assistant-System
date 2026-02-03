import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NeutrinoLogo from "../assets/neutrino-logo1.png";
import {
  EmailOutlined as EmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from "@mui/icons-material";

import authService from "../services/authService";

function Signup() {
  const navigate = useNavigate();

  // FORM STATES
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI STATES
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // PASSWORD VISIBILITY
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showMessage = (msg, isError = false) => {
    setError(isError ? msg : "");
    setSuccess(!isError ? msg : "");
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  // SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return showMessage("Email is required", true);

    setLoading(true);
    try {
      const res = await authService.sendSignupOTP(email);
      showMessage(res.message || "OTP sent successfully");
      setOtpSent(true);
    } catch (err) {
      showMessage(err.detail || "Failed to send OTP", true);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return showMessage("OTP is required", true);

    setLoading(true);
    try {
      const res = await authService.verifySignupOTP(email, otp);
      showMessage(res.message || "OTP verified");
      setOtpVerified(true);
    } catch (err) {
      showMessage(err.detail || "OTP verification failed", true);
    } finally {
      setLoading(false);
    }
  };

  // CREATE ACCOUNT
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName)
      return showMessage("Name fields are required", true);
    if (password.length < 8)
      return showMessage("Password must be at least 8 characters", true);
    if (password !== confirmPassword)
      return showMessage("Passwords do not match", true);

    setLoading(true);
    try {
      await authService.createAccount({
        first_name: firstName,
        middle_name: middleName || undefined,
        last_name: lastName,
        mobile_number: mobileNumber,
        email,
        password,
        confirm_password: confirmPassword,
      });

      showMessage("Account created successfully");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showMessage(err.detail || "Account creation failed", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative px-4 font-inter"
      style={{
        backgroundImage: "url(/ATS-Bg-Image.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* TOP LEFT LOGO */}
      <img
        src="/Neutrino-AI-Studio-Logo-White-Logo.png"
        alt="Neutrino AI Studio"
        className="absolute top-6 left-6 w-[200px]"
      />

      {/* GLASS CARD */}
      <div
        className="
          w-full max-w-[440px]
          bg-white/10 backdrop-blur-[50px]
          rounded-lg
          border border-white/20
          shadow-2xl
          px-10 py-10
        "
      >
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/ATS-RecruitIQ-White-Logo.png"
            alt="RecruitIQ"
            className="h-[44px] mb-4 object-contain"
          />
          <span className="text-white text-sm font-medium">
            Create Account
          </span>
        </div>

        {/* ERROR / SUCCESS */}
        {error && (
          <div className="mb-4 text-xs text-red-300 bg-red-900/30 border border-red-400/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-xs text-green-300 bg-green-900/30 border border-green-400/40 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        {/* STEP 1 — EMAIL */}
        {!otpSent && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs text-white mb-1">Email</label>
              <div className="relative">
                <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white" fontSize="small" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] pl-10 pr-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-full bg-white text-black text-sm font-semibold"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 — OTP */}
        {otpSent && !otpVerified && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full h-[42px] px-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-full bg-white text-black text-sm font-semibold"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {otpVerified && (
  <form onSubmit={handleCreateAccount} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {/* (00) FIRST NAME */}
      <div>
        <label className="block text-xs text-white mb-1">
          First Name
        </label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full h-[42px] px-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
        />
      </div>

      {/* (01) MIDDLE NAME */}
      <div>
        <label className="block text-xs text-white mb-1">
          Middle Name
        </label>
        <input
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          className="w-full h-[42px] px-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
        />
      </div>

      {/* (10) LAST NAME */}
      <div>
        <label className="block text-xs text-white mb-1">
          Last Name
        </label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full h-[42px] px-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
        />
      </div>

      {/* (11) MOBILE NUMBER */}
      <div>
        <label className="block text-xs text-white mb-1">
          Mobile Number
        </label>
        <input
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="w-full h-[42px] px-3 rounded-lg bg-white/5 text-white text-sm border border-white/20"
        />
      </div>

      {/* (20) PASSWORD */}
      <div>
  <label className="block text-xs text-white mb-1">
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full h-[42px] px-3 pr-10 rounded-lg bg-white/5 text-white text-sm border border-white/20"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
    >
      {showPassword ? (
        <VisibilityOff fontSize="small" />
      ) : (
        <Visibility fontSize="small" />
      )}
    </button>
  </div>
</div>


      {/* (21) CONFIRM PASSWORD */}
      <div>
  <label className="block text-xs text-white mb-1">
    Confirm Password
  </label>

  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      className="w-full h-[42px] px-3 pr-10 rounded-lg bg-white/5 text-white text-sm border border-white/20"
    />

    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
    >
      {showConfirmPassword ? (
        <VisibilityOff fontSize="small" />
      ) : (
        <Visibility fontSize="small" />
      )}
    </button>
  </div>
</div>

    </div>

    {/* SUBMIT BUTTON */}
    <button
      type="submit"
      disabled={loading}
      className="w-full h-[46px] rounded-full bg-white text-black text-sm font-semibold"
    >
      {loading ? "Creating..." : "Create Account"}
    </button>
  </form>
)}


        {/* LOGIN LINK */}
        <div className="text-center text-[12px] text-white/70 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-medium hover:underline">
            Login
          </Link>
        </div>

        {/* FOOTER */}
          <div className="mt-8 text-center text-[11px] text-white/70 flex items-center justify-center gap-2">
            Powered by
            <img src={NeutrinoLogo} alt="Neutrino" className="h-4" />
          </div>
      </div>
    </div>
  );
}

export default Signup;
