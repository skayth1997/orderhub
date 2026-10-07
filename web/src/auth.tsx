import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const TOKEN_KEY = 'orderhub_token';
export const UNAUTHORIZED_EVENT = 'orderhub:unauthorized';

export type Role = 'admin' | 'manager' | 'viewer';

interface TokenData {
  role: Role;
  exp: number;
}

function readToken(token: string | null): TokenData | null {
  if (!token) {
    return null;
  }
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenData;
  } catch {
    return null;
  }
}

function isExpired(token: string | null): boolean {
  const data = readToken(token);
  return !data || data.exp * 1000 <= Date.now();
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  return isExpired(token) ? null : token;
}

interface AuthValue {
  token: string | null;
  role: Role | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getToken());

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, []);

  useEffect(() => {
    const data = readToken(token);
    if (!data) {
      return;
    }
    const timer = setTimeout(logout, data.exp * 1000 - Date.now());
    return () => clearTimeout(timer);
  }, [token]);

  const value: AuthValue = {
    token,
    role: readToken(token)?.role ?? null,
    login: (newToken) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
