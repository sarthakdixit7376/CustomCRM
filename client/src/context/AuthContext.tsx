import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

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
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/me`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // If a request comes back 401 (e.g. session expired), drop the local user
  // so ProtectedRoute redirects to /login.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) {
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password });
    setUser(res.data);
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    setUser(res.data);
  };

  const logout = async () => {
    await axios.post(`${API_BASE}/api/auth/logout`);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signup, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
