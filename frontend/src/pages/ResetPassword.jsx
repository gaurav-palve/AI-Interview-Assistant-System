import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  EmailOutlined as EmailIcon,
  Lock as LockIcon,
  VpnKey as PinIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import NeutrinoLogo from "../assets/neutrino-logo1.png";
import authService from "../services/authService";

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
            Reset Password
          </span>
        </div>

        {/* ERROR */}
        {status && status !== "success" && (
          <div className="mb-4 text-xs text-red-300 bg-red-900/30 border border-red-400/40 rounded-lg px-3 py-2">
            {status}
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="mb-4 text-xs text-green-300 bg-green-900/30 border border-green-400/40 rounded-lg px-3 py-2 text-center">
            Password updated successfully! Redirecting…
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-xs text-white mb-1">
              Email
            </label>
            <div className="relative">
              <EmailIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                fontSize="small"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full h-[42px] pl-10 pr-3
                  rounded-lg
                  bg-white/5
                  text-white text-sm
                  border border-white/20
                  focus:outline-none focus:border-white/40
                "
              />
            </div>
          </div>

          {/* OTP */}
          <div>
            <label className="block text-xs text-white mb-1">
              OTP
            </label>
            <div className="relative">
              <PinIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                fontSize="small"
              />
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                maxLength={6}
                className="
                  w-full h-[42px] pl-10 pr-3
                  rounded-lg
                  bg-white/5
                  text-white text-sm tracking-widest
                  border border-white/20
                  focus:outline-none focus:border-white/40
                "
              />
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="block text-xs text-white mb-1">
              New Password
            </label>

            <div className="relative">
              <LockIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                fontSize="small"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="
                  w-full h-[42px] pl-10 pr-10
                  rounded-lg
                  bg-white/5
                  text-white text-sm
                  border border-white/20
                  focus:outline-none focus:border-white/40
                "
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

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs text-white mb-1">
              Confirm Password
            </label>

            <div className="relative">
              <LockIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                fontSize="small"
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="
                  w-full h-[42px] pl-10 pr-10
                  rounded-lg
                  bg-white/5
                  text-white text-sm
                  border border-white/20
                  focus:outline-none focus:border-white/40
                "
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
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

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full h-[46px]
              rounded-full
              bg-white
              text-black text-sm font-semibold
              hover:bg-gray-100 transition
              disabled:opacity-60
            "
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center text-[12px] text-white/70 mt-6">
  Didn’t get OTP?{" "}
  <Link
    to="/forgot-password"
    className="text-white font-medium hover:underline"
  >
    Resend
  </Link>
  <span className="mx-2 opacity-50">|</span>
  <Link
    to="/login"
    className="text-white font-medium hover:underline"
  >
    Back to Login
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
