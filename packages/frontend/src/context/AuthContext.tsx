import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { AuthInfo } from '../types';

const AUTH_KEY = 'webchat_auth';

interface AuthContextValue {
  auth: AuthInfo | null;
  setAuth: (a: AuthInfo | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthInfo | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function setAuth(a: AuthInfo | null) {
    setAuthState(a);
    if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    else localStorage.removeItem(AUTH_KEY);
  }

  function logout() {
    setAuth(null);
  }

  // 定期验证 token 有效性
  useEffect(() => {
    if (!auth) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) setAuth(null);
      } catch {
        setAuth(null);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [auth, setAuth]);

  return <AuthContext.Provider value={{ auth, setAuth, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
