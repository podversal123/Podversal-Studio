import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function redirectToLogin() {
  const raw = localStorage.getItem('user');
  const role = raw ? (JSON.parse(raw)?.role ?? '') : '';
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  if (role === 'SUPER_ADMIN')                                     window.location.href = '/admin/login';
  else if (role === 'REFERRAL_AGENT')                             window.location.href = '/agent/login';
  else if (role === 'STUDIO_MANAGER' || role === 'EMPLOYEE')      window.location.href = '/staff/login';
  else                                                            window.location.href = '/login';
}

let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        if (localStorage.getItem('access_token')) redirectToLogin();
        return Promise.reject(error);
      }

      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) { reject(error); return; }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      refreshing = true;
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken: string = res.data.accessToken;
        localStorage.setItem('access_token', newToken);
        queue.forEach(cb => cb(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        queue.forEach(cb => cb(null));
        queue = [];
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
