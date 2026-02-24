import axios from 'axios';

// ===============================
// Internal state
// ===============================
let isRefreshing = false;
let refreshSubscribers = [];
let tokenExpiryTime = null;

const TOKEN_REFRESH_BUFFER_MS = 60000; // 1 minute

// ===============================
// Helpers
// ===============================
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const parseTokenExpiry = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = () => {
  if (!tokenExpiryTime) return true;
  return Date.now() > tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS;
};

const updateStoredToken = (token) => {
  if (!token) return;

  localStorage.setItem('access_token', token);
  tokenExpiryTime = parseTokenExpiry(token);
};

// ===============================
// Refresh Access Token
// ===============================
const refreshAccessToken = async () => {
  // ❗ NEVER refresh on login page
  if (window.location.pathname === "/login") {
    return null;
  }

  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const newToken = response.data.access_token;
    updateStoredToken(newToken);

    return newToken;
  } catch (error) {
    console.error("Token refresh failed");

    // Clear local auth
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    tokenExpiryTime = null;

    // Redirect ONLY if not already on login
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    return null;
  }
};

// ===============================
// Axios Instance
// ===============================
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access_token");

  // Initialize expiry
  if (token && !tokenExpiryTime) {
    tokenExpiryTime = parseTokenExpiry(token);
  }

  const isLoginPage = window.location.pathname === "/login";

  // Refresh if needed (but NOT on login page)
  if (
    token &&
    !isLoginPage &&
    isTokenExpired() &&
    !isRefreshing &&
    !config.url.includes("/auth/refresh")
  ) {
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
    } finally {
      isRefreshing = false;
    }
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ===============================
    // Handle 401 → try refresh once
    // ===============================
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/signin") // ❗ DO NOT refresh during login
    ) {
      if (!isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            onTokenRefreshed(newToken);
            return api(originalRequest);
          }
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for refresh to complete
      return new Promise((resolve) => {
        addRefreshSubscriber((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    // ===============================
    // Final 401 → logout cleanly
    // ===============================
    if (error.response?.status === 401 && originalRequest._retry) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_email");
      tokenExpiryTime = null;

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // ===============================
    // 403 → permission issue (no redirect)
    // ===============================
    if (error.response?.status === 403) {
      error.isPermissionError = true;
      error.permissionMessage =
        error.response.data?.detail || "Permission denied";
    }

    return Promise.reject(error);
  }
);

export default api;
export { updateStoredToken, parseTokenExpiry };
