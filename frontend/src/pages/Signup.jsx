import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useFormValidation } from "../hooks/useFormValidation";
import { validateConfirmPassword } from "../utils/validation";
import Nts_logo from "../assets/Nts_logo/NTSLOGO.png";
import LoginBg from "../assets/login_bg.png"; // SAME LEFT-SIDE IMAGE AS LOGIN

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setError: setFieldError,
  } = useFormValidation(
    { email: "", password: "", confirmPassword: "" },
    {
      email: { required: true, email: true, fieldName: "Email" },
      password: { required: true, password: true, minLength: 8, fieldName: "Password" },
      confirmPassword: { required: true, fieldName: "Confirm Password" },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
    if (confirmError) {
      setFieldError("confirmPassword", confirmError);
      return;
    }

    setIsLoading(true);

    try {
      await signUp(values.email, values.password);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.detail || "Failed to create account. Please try again.");
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
        <div className="flex items-center justify-center p-10 bg-white">
          <div className="w-full" style={{ maxWidth: "330px" }}>

            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Create Your Account
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Start your journey with HireGenix
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
                <div className="font-semibold">Welcome!</div>
                <p className="text-xs mt-1">{success}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="name@company.com"
                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg focus:outline-none 
                      focus:ring-2 focus:ring-blue-400/40 ${
                        errors.email && touched.email ? "border-red-400" : "border-gray-200"
                      }`}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg focus:outline-none 
                      focus:ring-2 focus:ring-blue-400/40 ${
                        errors.password && touched.password ? "border-red-400" : "border-gray-200"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <VisibilityOff className="h-4 w-4" /> : <Visibility className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockResetIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg focus:outline-none 
                      focus:ring-2 focus:ring-blue-400/40 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <VisibilityOff className="h-4 w-4" /> : <Visibility className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

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

