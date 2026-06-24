import axios from "axios";

// Base URL is environment-driven so the app works beyond localhost.
// Set VITE_API_URL at build/dev time; falls back to the local backend.
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor to handle 401s (e.g., auto-logout)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage if token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to auth page if not already there
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
