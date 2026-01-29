import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useAuth } from "../contexts/AuthContext";

// import StudioLogo from "../assets/Neutrino-AI-Studio-White-Logo.png";
// import LoginLogo from "../assets/ATS-RecruitIQ-White-Logo.png";
import NeutrinoLogo from "../assets/neutrino-logo1.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Invalid email or password");
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

      {/* BACK */}
      <Link
        to="/"
        className="absolute bottom-6 left-6 flex items-center gap-1 text-white text-sm opacity-80 hover:opacity-100"
      >
        <ArrowBackIcon fontSize="small" />
        Back
      </Link>

      {/* LOGIN CARD */}
      <div
        className="
          w-full max-w-[440px]
          bg-white/10 backdrop-blur-[50px]
          rounded-lg
          border border-[#625D5D]
          shadow-xl
          px-8 py-7
        "
      >
        
        {/* HEADER */}
<div className="flex flex-col items-center mb-6">
  <img
    src="/ATS-RecruitIQ-White-Logo.png"
    alt="Neutrino AI Studio"
    className="h-[54px] mb-3 object-contain"
  />

  <span className="text-white text-base pb-1">
    Login
  </span>
</div>


        {/* ERROR */}
        {error && (
          <div className="mb-4 text-xs text-red-300 bg-red-900/30 border border-red-400/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-xs text-white mb-1">
              Email Address
            </label>
            <div className="relative">
              <EmailOutlinedIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                fontSize="small"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="
                  w-full h-[42px] pl-10 pr-3
                  rounded-lg bg-white/10 text-white text-sm
                  border border-white/30
                  focus:outline-none focus:border-white/60
                "
              
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs text-white mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="
                  w-full h-[42px] px-3 pr-10
                  rounded-lg bg-white/10 text-white text-sm
                  border border-white/30
                  focus:outline-none focus:border-white/60
                "
                placeholder="••••••••"
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

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full h-[42px]
              rounded-full
              bg-white text-black text-sm font-semibold
              hover:bg-gray-200 transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-5 text-center text-xs text-white/80 flex items-center justify-center gap-2">
          Powered by
          <img src={NeutrinoLogo} alt="Neutrino" className="h-4" />
        </div>
      </div>
    </div>
  );
}

export default Login;
