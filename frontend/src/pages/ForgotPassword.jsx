import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Email as EmailIcon } from "@mui/icons-material";
import authService from "../services/authService";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png";

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
            {/* Overlay */}
            <div className="
              absolute inset-0 
              bg-gradient-to-b 
              from-violet-900/25 via-indigo-900/25 to-purple-900/30
              backdrop-blur-[1px]
            "></div>

            {/* LEFT CONTENT */}
            <div className="relative z-10 w-full h-full flex flex-col pl-10 pr-6">

              {/* LOGO TOP */}
              <div className="flex items-center gap-3 pt-6">
                <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-xl p-2">
                  <img src={Nts_logo} alt="NTS Logo" className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-xl font-extrabold text-white drop-shadow-lg">Neutrino</p>
                  <p className="text-xs opacity-90 tracking-widest text-gray-200">Interview.AI</p>
                </div>
              </div>

              {/* GAP BETWEEN LOGO AND CENTER CONTENT */}
              <div className="h-16" />

              {/* CENTERED BLOCK */}
              <div className="flex flex-col justify-center flex-grow pb-20">
                <h1 className="
                  text-5xl font-extrabold 
                  bg-gradient-to-r from-violet-200 to-pink-200 
                  bg-clip-text text-transparent 
                  drop-shadow-xl
                ">
                  Reset Password
                </h1>

                <p className="mt-5 text-indigo-100 text-sm leading-relaxed max-w-xs">
                  Enter your registered email and we’ll send a secure OTP to reset your password.
                </p>

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

        {/* RIGHT PANEL */}
        <div className="flex items-center justify-center p-10 bg-white animate-rightFade">
          <div className="w-full max-w-xs">

            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Forgot Password?
            </h2>

            {/* ERROR */}
            {status && !showSuccess && status !== "sending" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {status}
              </div>
            )}

            {/* SUCCESS */}
            {showSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 text-center">
                OTP Sent Successfully! Redirecting…
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">
                  Enter your registered email
                </label>

                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 h-4 w-4" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 
                               rounded-lg text-sm focus:ring-2 focus:ring-violet-400/50 
                               outline-none transition-all"
                  />
                </div>
              </div>

              {/* SEND OTP */}
              <button
                type="submit"
                disabled={!email || status === "sending"}
                className="
                  w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white 
                  rounded-lg font-medium shadow-md hover:shadow-xl 
                  transition disabled:opacity-50
                "
              >
                {status === "sending" ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            {/* BACK TO LOGIN */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-500">Remember password?</span>
              <Link to="/login" className="text-violet-600 ml-1 font-medium hover:underline">
                Back to Login
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Animations */}
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

