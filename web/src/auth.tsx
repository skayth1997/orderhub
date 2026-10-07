import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const TOKEN_KEY = 'orderhub_token';

export type Role = 'admin' | 'manager' | 'viewer';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function readRole(token: string | null): Role | null {
  if (!token) {
    return null;
  }
  try {
    return JSON.parse(atob(token.split('.')[1])).role as Role;
  } catch {
    return null;
  }
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

  const value: AuthValue = {
    token,
    role: readRole(token),
    login: (newToken) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
