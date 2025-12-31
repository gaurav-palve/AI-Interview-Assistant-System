import api, { updateStoredToken, parseTokenExpiry } from './api';

/**
 * Authentication service for handling user authentication
 * Uses JWT tokens with refresh capability
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
      const response = await api.post('/auth/signin',
        { email, password },
        {
          withCredentials: true // Important to receive and store HttpOnly cookies
        }
      );
      
      if (response.data.access_token) {
        // Use the shared utility to store token and update expiry time
        updateStoredToken(response.data.access_token);
        localStorage.setItem('user_email', email);
        
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during sign in' };
    }
  },

  /**
   * Send OTP for signup (Step 1)
   * @param {string} email - Email to send OTP to
   * @returns {Promise} - Promise with the OTP sending result
   */
  sendSignupOTP: async (email) => {
    try {
      const response = await api.post('/auth/signup/send-otp', { email });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to send OTP' };
    }
  },

  /**
   * Verify OTP for signup (Step 2)
   * @param {string} email - Email address
   * @param {string|number} otp - OTP received via email
   * @returns {Promise} - Promise with the OTP verification result
   */
  verifySignupOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: parseInt(otp, 10)
      });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to verify OTP' };
    }
  },

  /**
   * Create account with password (Step 3)
   * @param {string} email - Email address
   * @param {string} password - Password
   * @param {string} confirm_password - Password confirmation
   * @returns {Promise} - Promise with account creation result
   */
  createAccount: async (userData) => {
    try {
      const response = await api.post('/auth/create-account', userData);
      return {
        success: true,
        message: 'Account created successfully',
        admin_id: response.data.admin_id
      };
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create account' };
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
      // Get stored refresh token from cookie (sent automatically)
      // Call the logout endpoint with credentials to send the httpOnly cookie
      await api.post('/auth/logout', {}, {
        withCredentials: true // Important to send the HttpOnly cookie
      });
      
      // Clear local storage tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('token_expiry'); // Clear expiration time if stored
      
      // Redirect to login page after successful logout
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // If the request fails, still remove local tokens as a fallback
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('token_expiry');
      
      console.error('Logout error:', error);
      // Still return success since we've cleared local tokens
      return { success: true, message: 'Logged out locally' };
    }
  },

  /**
   * Check if the user is authenticated
   * @returns {boolean} - True if the user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    // Check if token is expired
    const expiry = parseTokenExpiry(token);
    if (!expiry) return false;
    
    return Date.now() < expiry;
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
    // Check if token exists and is valid before returning
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    // Check if token is expired
    const expiry = parseTokenExpiry(token);
    if (!expiry || Date.now() >= expiry) {
      // Token is expired, clear it
      localStorage.removeItem('access_token');
      return null;
    }
    
    return token;
  },

  /**
 * Fetch logged-in user's permissions
 * @returns {Promise<string[]>}
 */
getUserPermissions: async () => {
  try {
    const response = await api.get("/permissions/user/permissions");
    return response.data.permissions || [];
  } catch (error) {
    console.error("Failed to fetch permissions:", error);
    throw error.response?.data || { detail: "Failed to fetch permissions" };
  }
},

/**
 * Fetch logged-in user's role
 * @returns {Promise<string>}
 */
getUserRole: async () => {
  try {
    const response = await api.get("/permissions/user/role");
    return response.data.role_name;
  } catch (error) {
    console.error("Failed to fetch role:", error);
    throw error.response?.data || { detail: "Failed to fetch user role" };
  }
},

};

export default authService;