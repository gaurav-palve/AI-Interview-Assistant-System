import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EmailOutlined as EmailIcon } from "@mui/icons-material";
import NeutrinoLogo from "../assets/neutrino-logo1.png";
import authService from "../services/authService";

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
      setStatus(err?.detail || "Failed to send OTP");
      setShowSuccess(false);
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
            Forgot Password
          </span>
        </div>

        {/* ERROR */}
        {status && !showSuccess && status !== "sending" && (
          <div className="mb-4 text-xs text-red-300 bg-red-900/30 border border-red-400/40 rounded-lg px-3 py-2">
            {status}
          </div>
        )}

        {/* SUCCESS */}
        {showSuccess && (
          <div className="mb-4 text-xs text-green-300 bg-green-900/30 border border-green-400/40 rounded-lg px-3 py-2 text-center">
            OTP sent successfully! Redirecting…
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="name@company.com"
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

          {/* SEND OTP */}
          <button
            type="submit"
            disabled={!email || status === "sending"}
            className="
              w-full h-[46px]
              rounded-full
              bg-white
              text-black text-sm font-semibold
              
              disabled:opacity-60
            "
          >
            {status === "sending" ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        {/* BACK TO LOGIN */}
        <div className="text-center text-[12px] text-white/70 mt-6">
          Remember password?{" "}
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
