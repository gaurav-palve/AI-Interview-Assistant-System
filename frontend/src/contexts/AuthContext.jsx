import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create the authentication context
const AuthContext = createContext();

/**
 * AuthProvider component to wrap the application and provide authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const email = authService.getCurrentUserEmail();
          setUser({ email });
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signIn(email, password);
      setUser({ email });
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const signUp = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signUp(email, password);
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.detail || 'Failed to log out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided by the context
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;