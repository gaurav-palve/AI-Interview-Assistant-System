import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  VpnKey as PinIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import authService from "../services/authService";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png"; // SAME IMAGE AS LOGIN

export default function ResetPassword() {
  const { state } = useLocation();
  const prefilledEmail = state?.email || "";

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setStatus("");

    try {
      await authService.resetPassword({
        email,
        otp: Number(otp),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setStatus("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus(err?.detail || "Failed to reset password. Please check OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#f7f8fc] flex items-center justify-center">

      {/* MAIN WRAPPER — SAME SIZE AS SIGNUP */}
      <div
        className="w-[95%] max-w-5xl h-[90vh] bg-white shadow-2xl rounded-2xl 
                   overflow-hidden grid grid-cols-1 lg:grid-cols-2"
      >

        {/* LEFT PANEL — MATCHES SIGNUP */}
        <div
          className="hidden lg:flex flex-col justify-between p-8 text-white relative"
          style={{
            backgroundImage: `url(${LoginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

          {/* LOGO */}
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

          {/* LEFT TEXT */}
          <div className="relative z-10 mt-6">
            <h1 className="text-3xl lg:text-4xl font-extrabold drop-shadow-lg text-gray-200">
              Reset Password
            </h1>
            <p className="mt-3 text-blue-100 text-sm max-w-xs drop-shadow-md leading-relaxed">
              Enter the OTP sent to your email and set a new secure password.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — FORM SIDE */}
        <div className="flex items-center justify-center p-8 bg-white">
          <div className="w-full" style={{ maxWidth: "330px" }}>

            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Create New Password
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter OTP and set your new password
            </p>

            {/* ERROR */}
            {status && status !== "success" && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {status}
              </div>
            )}

            {/* SUCCESS */}
            {status === "success" && (
              <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg text-center text-sm text-green-700">
                <div className="font-semibold">Password Updated!</div>
                <p>You will be redirected to login...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs 
                               focus:ring-2 focus:ring-blue-400/40 outline-none"
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="block text-xs font-semibold mb-1">OTP Code</label>
                <div className="relative">
                  <PinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg 
                               text-center tracking-widest font-mono text-sm focus:ring-2 focus:ring-blue-400/40"
                  />
                </div>
              </div>

              {/* NEW PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">New Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs 
                               focus:ring-2 focus:ring-blue-400/40 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs 
                               focus:ring-2 focus:ring-blue-400/40 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs 
                           rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            {/* LINKS */}
            <div className="text-center mt-5 text-xs">
              <span className="text-gray-500">Didn't get OTP?</span>
              <Link
                to="/forgot-password"
                className="text-blue-600 ml-1 font-medium"
              >
                Resend
              </Link>

              <div className="mt-2">
                <Link to="/login" className="text-blue-600 font-medium">
                  Back to Login
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}





