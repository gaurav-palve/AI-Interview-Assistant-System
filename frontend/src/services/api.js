import axios from 'axios';

// Flag to prevent multiple token refreshes at the same time
let isRefreshing = false;
// Store callbacks for requests that were paused due to token refresh
let refreshSubscribers = [];
// Track token expiration time
let tokenExpiryTime = null;
// Buffer time in milliseconds (refresh token if expires within this time)
const TOKEN_REFRESH_BUFFER_MS = 60000; // 1 minute

/**
 * Execute all callbacks after token refresh
 * @param {string} token - New access token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Subscribe to token refresh
 * @param {Function} callback - Function to call after token refresh
 */
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Parse JWT token to get expiration time
 * @param {string} token - JWT token
 * @returns {number} Expiration time in milliseconds
 */
const parseTokenExpiry = (token) => {
  if (!token) {
    console.error('Invalid token provided to parseTokenExpiry');
    return null;
  }
  
  try {
    // Split the token parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }
    
    // Base64 decode and parse the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Ensure exp claim exists
    if (!payload.exp) {
      console.error('Token missing expiration claim');
      return null;
    }
    
    // Convert seconds to milliseconds
    return payload.exp * 1000;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Check if token is expired or about to expire
 * @returns {boolean} True if token needs refresh
 */
const isTokenExpired = () => {
  // If we don't have an expiry time, consider it expired
  if (!tokenExpiryTime) {
    return true;
  }
  
  // Check if token is expired or will expire soon
  const now = Date.now();
  return now > (tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS);
};

/**
 * Update stored token and expiry time
 * @param {string} token - New access token
 */
const updateStoredToken = (token) => {
  if (token) {
    // Store in localStorage
    localStorage.setItem('access_token', token);
    
    // Parse and store expiration time
    tokenExpiryTime = parseTokenExpiry(token);
    
    console.log(`Token updated, expires at: ${new Date(tokenExpiryTime).toISOString()}`);
    console.log(`Will refresh after: ${new Date(tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS).toISOString()}`);
  }
};

// Export utility functions
export { parseTokenExpiry, updateStoredToken };

/**
 * Refresh the access token using the refresh token in HttpOnly cookie
 * @returns {Promise<string>} New access token
 */
const refreshAccessToken = async () => {
  try {
    console.log('Refreshing access token...');
    // Get the API base URL from environment or configuration
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    
    // The refresh token is automatically sent as an HttpOnly cookie
    const response = await axios.post(`${baseURL}/auth/refresh`, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // Important to include cookies
    });
    
    const newToken = response.data.access_token;
    
    // Update token expiry time
    updateStoredToken(newToken);
    
    return newToken;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    console.error('Token refresh failed:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    tokenExpiryTime = null;
    window.location.href = '/login';
    return null;
  }
};

// Get the API base URL from environment variable or use default
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: apiBaseUrl, // Backend API URL from environment
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 120000, // 120 second timeout (increased from 30s to handle LLM generation)
  // Disable automatic retries
  retry: false,
  retryDelay: 0,
  // Maximum content size to prevent memory issues
  maxContentLength: 10 * 1024 * 1024, // 10MB
});

// Add a request interceptor to include the access token in the Authorization header and log requests
api.interceptors.request.use(
  async (config) => {
    // First, initialize token expiry if we have a token but no expiry time
    const token = localStorage.getItem('access_token');
    if (token && !tokenExpiryTime) {
      tokenExpiryTime = parseTokenExpiry(token);
    }
    
    // If we have a token that is about to expire, refresh it proactively
    if (token && isTokenExpired() && !isRefreshing && !config.url.includes('/auth/refresh')) {
      console.log('Token is expired or about to expire, refreshing before request...');
      isRefreshing = true;
      
      try {
        // Get a fresh token
        const newToken = await refreshAccessToken();
        
        // Update the token in the current request
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          
        }
      
      } finally {
        isRefreshing = false;
      }
    }
    // Add the current token to the request
    else if (token) {
      // Add token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details for debugging
    console.group('API Request');
    console.log('URL:', `${config.baseURL}${config.url}`);
    console.log('Method:', config.method.toUpperCase());
    console.log('Params:', config.params);
    
    // Log data differently based on content type
    if (config.data) {
      if (config.data instanceof FormData) {
        console.log('Data: [FormData]');
        // Log FormData entries
        for (let pair of config.data.entries()) {
          if (pair[1] instanceof File) {
            console.log(`  ${pair[0]}: File (${pair[1].name}, ${pair[1].size} bytes)`);
          } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
          }
        }
      } else {
        console.log('Data:', config.data);
      }
    }
    console.log('Headers:', config.headers);
    console.groupEnd();
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors and log responses
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.group('API Response');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error response
    console.group('API Error');
    console.error('Request URL:', originalRequest?.url);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Error:', error.message);
    console.groupEnd();
    
    // Handle authentication errors - attempt token refresh for 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If we're not already refreshing a token
      if (!isRefreshing) {
        console.log('Attempting to refresh access token');
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Try to refresh the token
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            // Update token in local storage
            localStorage.setItem('access_token', newToken);
            
            // Update token in axios headers
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Notify all waiting requests that token is refreshed
            onTokenRefreshed(newToken);
            
            console.log('Token refresh successful, retrying original request');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If we're already refreshing, wait for the token
        console.log('Waiting for token refresh to complete');
        
        // Create a new promise that will resolve when token is refreshed
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            // Replace the token in the original request
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            // Retry the original request
            resolve(api(originalRequest));
          });
        });
      }
    }
    // For 403 errors or any other auth errors that aren't handled by refresh
    else if (error.response && (error.response.status === 403 ||
             (error.response.status === 401 && originalRequest._retry))) {
      console.log('Authentication error - redirecting to login');
      // Clear the token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      window.location.href = '/login';
    }
    
    // Enhance error object with more details
    if (error.response && error.response.data) {
      error.detail = error.response.data.detail || 'An error occurred';
      console.log('Error detail:', error.detail);
    }
    
    return Promise.reject(error);
  }
);

export default api;