import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Email as EmailIcon } from "@mui/icons-material";
import authService from "../services/authService";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png"; // SAME BACKGROUND AS LOGIN

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await authService.forgotPassword(email);
      setStatus("sent");
      setShowSuccess(true);
    } catch (err) {
      setStatus(err?.detail || "An error occurred while sending OTP");
      setShowSuccess(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#f7f8fc] flex items-center justify-center">

      {/* MAIN WRAPPER (Same as Login) */}
      <div className="w-[95%] max-w-5xl h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL — MATCH LOGIN */}
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white relative"
          style={{
            backgroundImage: `url(${LoginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

          {/* Logo */}
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

          {/* Heading */}
          <div className="relative z-10 mt-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold drop-shadow-lg text-gray-200">
              Reset Password
            </h1>
            <p className="mt-4 text-blue-100 text-sm max-w-xs drop-shadow-md">
              Enter your registered email and we’ll send a secure OTP to reset your password.
            </p>

            <button className="mt-6 px-6 py-2.5 bg-white text-blue-700 text-sm font-semibold rounded-full hover:bg-gray-100 transition shadow-md">
              View more
            </button>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex items-center justify-center p-10 bg-white">
          <div className="w-full" style={{ maxWidth: "330px" }}>

            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Enter your registered email</p>

            {/* Error */}
            {status && !showSuccess && status !== "sending" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {status}
              </div>
            )}

            {/* Success */}
            {showSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
                <div className="font-semibold">OTP Sent!</div>
                <p className="text-xs mt-1">Redirecting...</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400/40 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "sending" || !email}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {status === "sending" ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            {/* BACK TO LOGIN */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Remember password?</span>
              <Link to="/login" className="text-blue-600 ml-1 font-medium">
                Back to Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
