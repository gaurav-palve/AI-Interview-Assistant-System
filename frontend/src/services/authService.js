import api from './api';

/**
 * Authentication service for handling user authentication
 */
const authService = {
  /**
   * Sign in an admin user
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise} - Promise with the authentication result
   */
  signIn: async (email, password) => {
    try {
      const response = await api.post('/auth/signin', { email, password });
      if (response.data.access_token) {
        localStorage.setItem('session_token', response.data.access_token);
        localStorage.setItem('user_email', email);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during sign in' };
    }
  },

  /**
   * Sign up a new admin user
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise} - Promise with the signup result
   */
  signUp: async (email, password) => {
    try {
      const response = await api.post('/auth/signup', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during sign up' };
    }
  },

  /**
   * Send forgot-password request to backend to generate/send OTP
   * @param {string} email
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Error sending OTP' };
    }
  },

  /**
   * Reset user password using email + otp + new password
   * @param {{email: string, otp: number|string, new_password: string, confirm_password: string}} payload
   */
  resetPassword: async ({ email, otp, new_password, confirm_password }) => {
    try {
      const response = await api.post('/reset-password', {
        email,
        otp,
        new_password,
        confirm_password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Error resetting password' };
    }
  },

  /**
   * Log out the current user
   * @returns {Promise} - Promise with the logout result
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (token) {
        await api.post('/auth/logout', { token });
      }
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_email');
      return { success: true };
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during logout' };
    }
  },

  /**
   * Check if the user is authenticated
   * @returns {boolean} - True if the user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('session_token');
  },

  /**
   * Get the current user's email
   * @returns {string|null} - The user's email or null if not authenticated
   */
  getCurrentUserEmail: () => {
    return localStorage.getItem('user_email');
  },

  /**
   * Get the current session token
   * @returns {string|null} - The session token or null if not authenticated
   */
  getToken: () => {
    return localStorage.getItem('session_token');
  }
};

export default authService;