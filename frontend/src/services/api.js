import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

const isPublicFormPath = (pathname = '') => /^\/f\/[^/]+\/?$/.test(pathname);
const isPublicFormRequest = (url = '') =>
  url.includes('/api/public/') || url.includes('/api/responses/submit/');

// Attach token to every request
api.interceptors.request.use((config) => {
  if (isPublicFormRequest(config.url || '')) {
    delete config.headers['Authorization'];
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';
      const isPublicFormPage = isPublicFormPath(currentPath);
      const isAuthBootstrapRequest = requestUrl.includes('/api/auth/me');
      const isPublicRequest = isPublicFormRequest(requestUrl);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }

      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        if (!isPublicFormPage && !isAuthBootstrapRequest && !isPublicRequest) {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    }
    return Promise.reject(error);
  }
);

export default api;
