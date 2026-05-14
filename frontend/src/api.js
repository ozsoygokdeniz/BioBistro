import axios from 'axios';

const API_HOST = window.location.hostname;
const api = axios.create({
  baseURL: `http://${API_HOST}:8000/api/v1/`,
});

// Request interceptor — her isteğe token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 gelirse token sil ve login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Zaten login sayfasında değilsek yönlendir
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
