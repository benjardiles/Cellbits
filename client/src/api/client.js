import axios from 'axios';

const TOKEN_KEY = 'cellbits_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((request) => {
  const token = getToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      // Solo redirigir dentro del sistema interno: la landing y /scan son públicas.
      const path = window.location.pathname;
      if (path.startsWith('/app') && !path.startsWith('/app/login')) {
        window.location.href = '/app/login';
      }
    }
    return Promise.reject(error);
  },
);

export function extractApiError(error) {
  const message = error.response?.data?.message || error.message || 'Error desconocido.';
  const details = error.response?.data?.details;
  if (Array.isArray(details) && details.length) {
    return { message, details };
  }
  return { message, details: [] };
}