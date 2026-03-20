import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, profileApi, type AuthUser } from '../lib/api';

interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signup: (input: { email: string; password: string; name?: string }) => Promise<AuthUser>;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  adminLogin: (input: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  updateProfile: (updates: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    status?: string;
  }) => Promise<AuthUser>;
}

const STORAGE_KEY = 'si_auth_session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSessionFromStorage(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.token || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);
    if (!nextSession) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  const refreshUser = useCallback(async () => {
    const current = readSessionFromStorage();
    if (!current?.token) {
      persistSession(null);
      return null;
    }

    try {
      const { user } = await authApi.me(current.token);
      const next = { token: current.token, user };
      persistSession(next);
      return user;
    } catch {
      persistSession(null);
      return null;
    }
  }, [persistSession]);

  useEffect(() => {
    const initialize = async () => {
      const local = readSessionFromStorage();
      if (!local) {
        setLoading(false);
        return;
      }

      setSession(local);
      await refreshUser();
      setLoading(false);
    };

    initialize();
  }, [refreshUser]);

  const signup = useCallback(async (input: { email: string; password: string; name?: string }) => {
    const { token, user } = await authApi.signup(input);
    persistSession({ token, user });
    return user;
  }, [persistSession]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const { token, user } = await authApi.login(input);
    persistSession({ token, user });
    return user;
  }, [persistSession]);

  const adminLogin = useCallback(async (input: { email: string; password: string }) => {
    const { token, user } = await authApi.adminLogin(input);
    persistSession({ token, user });
    return user;
  }, [persistSession]);

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const updateProfile = useCallback(async (updates: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    status?: string;
  }) => {
    if (!session?.token) {
      throw new Error('You must be logged in to update profile.');
    }

    const { user } = await profileApi.update(session.token, updates);
    persistSession({ token: session.token, user });
    return user;
  }, [session, persistSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    token: session?.token || null,
    loading,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.user?.role === 'admin',
    signup,
    login,
    adminLogin,
    logout,
    refreshUser,
    updateProfile,
  }), [session, loading, signup, login, adminLogin, logout, refreshUser, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
