import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  /* setAuth / logout 必须引用稳定。
     原先它们每次 render 都重建，导致：
     1) 依赖它们的 useEffect（WebSocket 建连、token 轮询）被反复拆掉重建；
     2) context value 每次都是新对象，所有 useAuth() 消费者无条件重渲染。 */
  const setAuth = useCallback((a: AuthInfo | null) => {
    setAuthState(a);
    if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    else localStorage.removeItem(AUTH_KEY);
  }, []);

  const logout = useCallback(() => {
    setAuthState(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  // 定期验证 token 有效性。只依赖 token 字符串本身，避免对象引用变化引发重建。
  const token = auth?.token;
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}`, 'X-Auth-Token': token },
        });
        if (!res.ok) setAuth(null);
      } catch {
        // 网络抖动不应导致登出，交给下一次轮询
      }
    }, 60000);
    return () => clearInterval(id);
  }, [token, setAuth]);

  const value = useMemo(() => ({ auth, setAuth, logout }), [auth, setAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
