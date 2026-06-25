import axios from 'axios';

// Single axios instance used across the entire frontend
// Base URL comes from environment variable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (token expired) globally — only redirect if user was already logged in
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('access_token');
      if (hadToken) {
        // Token expired mid-session — clear and redirect to appropriate login
        const raw = localStorage.getItem('user');
        const role = raw ? (JSON.parse(raw)?.role ?? '') : '';
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (role === 'SUPER_ADMIN')    window.location.href = '/admin/login';
        else if (role === 'REFERRAL_AGENT') window.location.href = '/agent/login';
        else if (role === 'STUDIO_MANAGER' || role === 'EMPLOYEE') window.location.href = '/staff/login';
        else window.location.href = '/login';
      }
      // If no token existed — it's a login attempt, let the error propagate to the form
    }
    return Promise.reject(error);
  },
);

export default api;
