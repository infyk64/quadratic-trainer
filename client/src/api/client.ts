import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Прикрепляем JWT токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Если токен истёк — разлогиниваем
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Не разлогиниваем на странице логина
      if (currentPath !== '/' && currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);