'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  alias: string;
  isGuest: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (alias: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('changosbet_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const login = (alias: string) => {
    const u: User = { id: uuidv4(), alias: alias.trim(), isGuest: true };
    localStorage.setItem('changosbet_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('changosbet_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
