import axios from 'axios';
import { store } from '../store/index.js';
import { logout } from '../store/authSlice.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isAuthEndpoint = url => /\/auth\/(login|register|refresh-token)/.test(url || '');

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
