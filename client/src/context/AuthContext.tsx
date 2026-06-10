import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  sellerLogin: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('oshop_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await api.get<User>('/auth/me');
      setUser(userData);
    } catch {
      localStorage.removeItem('oshop_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    localStorage.setItem('oshop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const sellerLogin = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>('/auth/seller-login', { email, password });
    localStorage.setItem('oshop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await api.post<{ user: User; token: string }>('/auth/register', { email, password, name });
    localStorage.setItem('oshop_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('oshop_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    const updated = await api.put<User>('/auth/profile', data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        sellerLogin,
        register,
        logout,
        updateProfile,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
