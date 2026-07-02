import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authApi, profileApi, type AuthUser } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { hasExplicitApiBase, isLocalHost, useSupabaseAuth } from '../lib/runtime';

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
  signup: (input: { email: string; password: string; name?: string; phone?: string; rememberMe?: boolean }) => Promise<AuthUser>;
  login: (input: { email: string; password: string; rememberMe?: boolean }) => Promise<AuthUser>;
  adminLogin: (input: { email: string; password: string; rememberMe?: boolean }) => Promise<AuthUser>;
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
  role: string | null;
}

function mapSupabaseAuthError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes('provider') &&
    normalized.includes('not enabled')
  ) {
    return 'Google sign-in is not enabled in Supabase Auth Providers. Use email/password for now or enable Google provider in Supabase dashboard.';
  }

  if (
    normalized.includes('database error saving new user') ||
    normalized.includes('database error creating new user')
  ) {
    return 'Supabase could not create your account. Please run the SQL migrations in Supabase (supabase_migrations/001_auth.sql), then try again.';
  }

  return errorMessage;
}

function readSessionFromStorage(): AuthSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
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

  const persistSession = useCallback((nextSession: AuthSession | null, rememberMe?: boolean) => {
    setSession(nextSession);
    if (!nextSession) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (rememberMe === true) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      sessionStorage.removeItem(STORAGE_KEY);
    } else if (rememberMe === false) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      localStorage.removeItem(STORAGE_KEY);
    } else {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      }
    }
  }, []);

  const buildSupabaseAuthUser = useCallback(async (supabaseUser: User): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone, avatar_url, provider, role')
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
    const role = (profile?.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin';

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role,
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
    // If we have a local session with an admin role (which was logged in via adminLogin),
    // and we are bypassing Supabase for it, don't let Supabase wipe it.
    const current = readSessionFromStorage();
    if (useSupabaseAuth && current?.user?.role !== 'admin') {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        persistSession(null);
        return null;
      }
      return syncSupabaseSession(data.session);
    }

    const fallbackCurrent = readSessionFromStorage();
    if (!fallbackCurrent?.token) {
      persistSession(null);
      return null;
    }

    try {
      const { user } = await authApi.me(fallbackCurrent.token);
      const next = { token: fallbackCurrent.token, user };
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
        // Do not wipe admin session on auth state changes
        const current = readSessionFromStorage();
        if (current?.user?.role !== 'admin') {
          void syncSupabaseSession(updatedSession);
        }
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

  const signup = useCallback(async (input: { email: string; password: string; name?: string; phone?: string; rememberMe?: boolean }) => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.name || null,
            name: input.name || null,
            phone: input.phone || null,
          },
        },
      });

      if (error) {
        const mapped = mapSupabaseAuthError(error.message);
        // For database trigger errors, surface the helpful message directly — don't
        // silently fall back to local SQLite (which is ephemeral on Vercel).
        const isDatabaseError =
          error.message.toLowerCase().includes('database error');
        if (isDatabaseError) {
          throw new Error(mapped);
        }
        // For other Supabase errors (outage, email taken, etc.) fall back to local API.
        const { token, user } = await authApi.signup(input);
        persistSession({ token, user }, input.rememberMe);
        return user;
      }

      const activeSession = data.session || (await supabase.auth.getSession()).data.session;
      if (!activeSession) {
        throw new Error('Signup successful. Please verify your email, then sign in.');
      }

      // Create or update profile immediately after signup
      if (activeSession?.user?.id) {
        try {
          const payload = {
            id: activeSession.user.id,
            name: input.name || null,
            phone: input.phone || null,
            avatar_url: null,
            provider: 'email',
            updated_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        } catch (profileErr) {
          console.warn('Profile creation warning:', profileErr);
          // Don't fail signup if profile creation fails
        }
      }

      const user = await syncSupabaseSession(activeSession);
      if (!user) {
        throw new Error('Could not complete signup session.');
      }

      return user;
    }

    const { token, user } = await authApi.signup(input);
    persistSession({ token, user }, input.rememberMe);
    return user;
  }, [persistSession, syncSupabaseSession]);

  const login = useCallback(async (input: { email: string; password: string; rememberMe?: boolean }) => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        // Fallback to backend API for local email accounts and Supabase outages.
        const { token, user } = await authApi.login(input);
        persistSession({ token, user }, input.rememberMe);
        return user;
      }

      const user = await syncSupabaseSession(data.session);
      if (!user) {
        throw new Error('Could not establish session after login.');
      }

      return user;
    }

    const { token, user } = await authApi.login(input);
    persistSession({ token, user }, input.rememberMe);
    return user;
  }, [persistSession, syncSupabaseSession]);

  const adminLogin = useCallback(async (input: { email: string; password: string; rememberMe?: boolean }) => {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        // Fallback to local admin login (for bypass mode)
        const { token, user } = await authApi.adminLogin(input);
        persistSession({ token, user }, input.rememberMe);
        return user;
      }

      const user = await syncSupabaseSession(data.session);
      if (!user) {
        throw new Error('Could not establish session after admin login.');
      }

      if (user.role !== 'admin') {
        await supabase.auth.signOut();
        persistSession(null);
        throw new Error('This account does not have admin access.');
      }

      return user;
    }

    if (!hasExplicitApiBase && !isLocalHost) {
      throw new Error('Admin login requires the local backend API deployment.');
    }

    const { token, user } = await authApi.adminLogin(input);
    persistSession({ token, user }, input.rememberMe);
    return user;
  }, [persistSession, syncSupabaseSession]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    if (!useSupabaseAuth) {
      throw new Error('Google sign-in is only available in Supabase auth mode. Set VITE_AUTH_MODE=supabase and reload the page.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw new Error(mapSupabaseAuthError(error.message));
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
