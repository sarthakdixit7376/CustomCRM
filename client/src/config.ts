import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://customcrm.up.railway.app');

const TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Send the httpOnly auth cookie with every request.
axios.defaults.withCredentials = true;

// Also send the token as a Bearer header. Safari (iOS/macOS) blocks
// cross-site cookies, so the cookie alone is not enough when the API
// lives on a different domain than the frontend.
axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
