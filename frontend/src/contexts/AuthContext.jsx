import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

// ==================
// LocalStorage Keys
// ==================
const LS_EMAIL_KEY = "auth_email";
const LS_PERMS_KEY = "auth_permissions";

// ==================
// Create Context
// ==================
const AuthContext = createContext(null);

// ==================
// Auth Provider
// ==================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================
  // Initialize Auth
  // ==================
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const email =
            authService.getCurrentUserEmail() ||
            localStorage.getItem(LS_EMAIL_KEY);

          const permissions = JSON.parse(
            localStorage.getItem(LS_PERMS_KEY) || "[]"
          );

          if (email) {
            setUser({ email, permissions });
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setError("Failed to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ==================
  // Sign In
  // ==================
  const signIn = async (email, password) => {
  setLoading(true);
  setError(null);

  try {
    // 1️⃣ Login (tokens only)
    await authService.signIn(email, password);

    // 2️⃣ Fetch permissions from separate API
    const permissions = await authService.getUserPermissions();

    // 3️⃣ Persist
    localStorage.setItem(LS_EMAIL_KEY, email);
    localStorage.setItem(LS_PERMS_KEY, JSON.stringify(permissions));

    setUser({ email, permissions });

  } catch (err) {
    console.error("Login failed:", err);
    setError(err?.detail || "Failed to sign in");
    throw err;
  } finally {
    setLoading(false);
  }
};


  // ==================
  // Sign Up
  // ==================
  const signUp = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      return await authService.signUp(email, password);
    } catch (err) {
      setError(err?.detail || "Failed to sign up");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================
  // Logout
  // ==================
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();

      // Clear storage
      localStorage.removeItem(LS_EMAIL_KEY);
      localStorage.removeItem(LS_PERMS_KEY);

      setUser(null);
    } catch (err) {
      setError(err?.detail || "Failed to log out");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================
  // Permission Checker
  // ==================
  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };

  // ==================
  // Context Value
  // ==================
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================
// Custom Hook
// ==================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
