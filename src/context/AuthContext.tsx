import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authApi, profileApi, type AuthUser } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';

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
  signInWithGoogle: (idToken: string) => Promise<AuthUser>;
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

interface ProfileRow {
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
}

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

  const buildSupabaseAuthUser = useCallback(async (supabaseUser: User): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone, avatar_url, provider')
      .eq('id', supabaseUser.id)
      .maybeSingle<ProfileRow>();

    const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
    const metaName = typeof meta?.full_name === 'string'
      ? meta.full_name
      : typeof meta?.name === 'string'
        ? meta.name
        : null;
    const metaAvatar = typeof meta?.avatar_url === 'string' ? meta.avatar_url : null;

    const name = profile?.name || metaName;
    const phone = profile?.phone || null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: 'user',
      name,
      phone,
      avatar_url: profile?.avatar_url || metaAvatar,
      status: null,
      provider: profile?.provider || (supabaseUser.app_metadata?.provider as string | undefined) || 'email',
      is_profile_complete: Boolean(name && phone),
    };
  }, []);

  const syncSupabaseSession = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.access_token || !activeSession.user) {
      persistSession(null);
      return null;
    }

    const user = await buildSupabaseAuthUser(activeSession.user);
    const next = {
      token: activeSession.access_token,
      user,
    };

    persistSession(next);
    return user;
  }, [buildSupabaseAuthUser, persistSession]);

  const refreshUser = useCallback(async () => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        persistSession(null);
        return null;
      }
      return syncSupabaseSession(data.session);
    }

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
  }, [persistSession, syncSupabaseSession]);

  useEffect(() => {
    if (useSupabaseAuth) {
      const initializeSupabase = async () => {
        await refreshUser();
        setLoading(false);
      };

      initializeSupabase();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
        void syncSupabaseSession(updatedSession);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

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
  }, [refreshUser, syncSupabaseSession]);

  const signup = useCallback(async (input: { email: string; password: string; name?: string }) => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.name || null,
            name: input.name || null,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const activeSession = data.session || (await supabase.auth.getSession()).data.session;
      if (!activeSession) {
        throw new Error('Signup successful. Please verify your email, then sign in.');
      }

      const user = await syncSupabaseSession(activeSession);
      if (!user) {
        throw new Error('Could not complete signup session.');
      }

      return user;
    }

    const { token, user } = await authApi.signup(input);
    persistSession({ token, user });
    return user;
  }, [persistSession, syncSupabaseSession]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const user = await syncSupabaseSession(data.session);
      if (!user) {
        throw new Error('Could not establish session after login.');
      }

      return user;
    }

    const { token, user } = await authApi.login(input);
    persistSession({ token, user });
    return user;
  }, [persistSession, syncSupabaseSession]);

  const adminLogin = useCallback(async (input: { email: string; password: string }) => {
    if (useSupabaseAuth) {
      throw new Error('Admin login requires the local backend API deployment.');
    }

    const { token, user } = await authApi.adminLogin(input);
    persistSession({ token, user });
    return user;
  }, [persistSession]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    if (!useSupabaseAuth) {
      throw new Error('Google sign-in is available on Supabase auth mode.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    const activeSession = data.session || (await supabase.auth.getSession()).data.session;
    if (!activeSession) {
      throw new Error('Google sign-in did not return a valid session.');
    }

    const user = await syncSupabaseSession(activeSession);
    if (!user) {
      throw new Error('Could not establish session after Google sign-in.');
    }

    return user;
  }, [syncSupabaseSession]);

  const logout = useCallback(() => {
    if (useSupabaseAuth) {
      void supabase.auth.signOut();
    }

    persistSession(null);
  }, [persistSession]);

  const updateProfile = useCallback(async (updates: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    status?: string;
  }) => {
    if (useSupabaseAuth) {
      if (!session?.user?.id) {
        throw new Error('You must be logged in to update profile.');
      }

      const payload = {
        id: String(session.user.id),
        name: updates.name ?? session.user.name ?? null,
        phone: updates.phone ?? session.user.phone ?? null,
        avatar_url: updates.avatar_url ?? session.user.avatar_url ?? null,
        provider: session.user.provider || 'email',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(payload, {
        onConflict: 'id',
      });

      if (error) {
        throw new Error(error.message);
      }

      const refreshed = await refreshUser();
      if (!refreshed) {
        throw new Error('Profile updated but session refresh failed.');
      }

      return refreshed;
    }

    if (!session?.token) {
      throw new Error('You must be logged in to update profile.');
    }

    const { user } = await profileApi.update(session.token, updates);
    persistSession({ token: session.token, user });
    return user;
  }, [refreshUser, session, persistSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    token: session?.token || null,
    loading,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.user?.role === 'admin',
    signup,
    login,
    adminLogin,
    signInWithGoogle,
    logout,
    refreshUser,
    updateProfile,
  }), [session, loading, signup, login, adminLogin, signInWithGoogle, logout, refreshUser, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
