import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Backend API URL
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

// Add a request interceptor to include the session token in requests and log requests
api.interceptors.request.use(
  (config) => {
    // Add session token
    const token = localStorage.getItem('session_token');
    if (token) {
      // Always add token as a query parameter for all request types
      // This ensures consistency with the backend expectations
      config.params = {
        ...config.params,
        session_token: token,
      };
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
  (error) => {
    // Log error response
    console.group('API Error');
    console.error('Request URL:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Error:', error.message);
    console.groupEnd();
    
    // Handle 401 Unauthorized errors (expired or invalid token)
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - redirecting to login');
      // Clear the token and redirect to login
      localStorage.removeItem('session_token');
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