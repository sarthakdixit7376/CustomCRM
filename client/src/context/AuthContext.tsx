import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { API_BASE, setAuthToken, clearAuthToken } from '../config';

export type Role = 'ADMIN' | 'AGENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/me`);
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, []);

  // If a request comes back 401 (e.g. session expired), drop the local user
  // so ProtectedRoute redirects to /login.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) {
          clearAuthToken();
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password });
    const { token, ...userData } = res.data;
    if (token) setAuthToken(token);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { token, ...userData } = res.data;
    if (token) setAuthToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`);
    } catch {
      // The server session will expire independently; do not block local logout.
    } finally {
      // Logging out locally must still succeed if the API is unavailable.
      clearAuthToken();
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
