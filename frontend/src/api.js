import axios from 'axios';

const API_HOST = window.location.hostname;
const api = axios.create({
  baseURL: `http://${API_HOST}:8000/api/v1/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
