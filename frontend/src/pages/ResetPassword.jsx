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
import LoginBg from "../assets/login_bg.png";

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
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-100 via-white to-indigo-100 
                    flex items-center justify-center p-4 animate-pageFade">

      {/* MAIN CARD */}
      <div className="
        w-full max-w-4xl bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl 
        overflow-hidden border border-white/40 grid grid-cols-1 lg:grid-cols-2 animate-cardUp
      ">

        {/* LEFT PANEL (Smaller + Balanced) */}
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
            <div className="
              absolute inset-0 bg-gradient-to-b 
              from-violet-900/25 via-indigo-900/15 to-purple-900/25 
              backdrop-blur-[1px]
            " />

            {/* TOP LOGO */}
            <div className="relative z-10 flex items-center gap-3 px-6 pt-6">
              <div className="w-11 h-11 bg-white/95 rounded-full flex items-center justify-center shadow-xl p-2">
                <img src={Nts_logo} alt="Logo" className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white drop-shadow-lg">Neutrino</p>
                <p className="text-[10px] opacity-90 tracking-widest text-gray-200">RecruitIQ</p>
              </div>
            </div>

            {/* CENTER CONTENT */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center px-8 pb-10">
              <h1 className="
                text-4xl font-extrabold 
                bg-gradient-to-r from-violet-200 to-pink-200 
                bg-clip-text text-transparent drop-shadow-xl
              ">
                Reset Password
              </h1>

              <p className="mt-4 text-indigo-100 text-sm leading-relaxed max-w-[240px]">
                Enter the OTP sent to your email and create a secure new password.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (Shrunk + Fits Perfectly) */}
        <div className="flex items-center justify-center p-8 bg-white animate-rightFade overflow-visible">
          <div className="w-full max-w-[280px]">

            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Create New Password
            </h2>
            

            {/* ERROR */}
            {status && status !== "success" && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700">
                {status}
              </div>
            )}

            {/* SUCCESS */}
            {status === "success" && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center text-[12px] text-green-700">
                <div className="font-semibold">Password Updated!</div>
                <p>You will be redirected...</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <label className="block text-base font-semibold mb-1">Email</label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-base
                               focus:ring-2 focus:ring-blue-400/40 outline-none"
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="block text-base font-semibold mb-1">OTP Code</label>
                <div className="relative">
                  <PinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg 
                                tracking-widest font-mono text-base focus:ring-2 focus:ring-blue-400/40"
                  />
                </div>
              </div>

              {/* NEW PASSWORD */}
              <div>
                <label className="block text-base font-semibold mb-1">New Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-gray-50 border rounded-lg text-[12px]
                               focus:ring-2 focus:ring-violet-400/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-base font-semibold mb-1">Confirm Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-gray-50 border rounded-lg text-[12px]
                               focus:ring-2 focus:ring-violet-400/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base 
                           rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            {/* LINKS */}
            <div className="text-center mt-5 text-sm">
              <span className="text-gray-500">Didn't get OTP?</span>
              <Link to="/forgot-password" className="text-violet-600 ml-1 font-medium">
                Resend
              </Link>

              <div className="mt-2">
                <Link to="/login" className="text-violet-600 font-medium">
                  Back to Login
                </Link>
              </div>
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


