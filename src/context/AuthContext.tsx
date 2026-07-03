import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { AuthUser } from '../lib/api';

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
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateProfile: (updates: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    status?: string;
  }) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface ProfileRow {
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
  role: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildSupabaseAuthUser = useCallback(async (supabaseUser: User): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone, avatar_url, provider, role')
      .eq('id', supabaseUser.id)
      .maybeSingle<ProfileRow>();

    const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
    const name = profile?.name || meta?.full_name || meta?.name || null;
    const role = (profile?.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin';

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role,
      name: name as string | null,
      phone: profile?.phone || null,
      avatar_url: profile?.avatar_url || (meta?.avatar_url as string | null) || null,
      status: null,
      provider: profile?.provider || (supabaseUser.app_metadata?.provider as string | undefined) || 'email',
      is_profile_complete: Boolean(name && profile?.phone),
    };
  }, []);

  const syncSession = useCallback(async (activeSession: Session | null) => {
    setSession(activeSession);
    if (!activeSession?.user) {
      setAuthUser(null);
      return null;
    }
    const user = await buildSupabaseAuthUser(activeSession.user);
    setAuthUser(user);
    return user;
  }, [buildSupabaseAuthUser]);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      await syncSession(activeSession);
      setLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      void syncSession(updatedSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const signup = useCallback(async (input: { email: string; password: string; name?: string; phone?: string; rememberMe?: boolean }) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name || null,
          phone: input.phone || null,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Signup successful. Please verify your email.');

    const user = await syncSession(data.session);
    if (!user) throw new Error('Could not complete signup session.');
    return user;
  }, [syncSession]);

  const login = useCallback(async (input: { email: string; password: string; rememberMe?: boolean }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new Error(error.message);
    const user = await syncSession(data.session);
    if (!user) throw new Error('Could not establish session after login.');
    return user;
  }, [syncSession]);

  const adminLogin = useCallback(async (input: { email: string; password: string; rememberMe?: boolean }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new Error(error.message);
    
    const user = await buildSupabaseAuthUser(data.session.user);
    if (user.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account does not have admin access.');
    }
    
    await syncSession(data.session);
    return user;
  }, [buildSupabaseAuthUser, syncSession]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw new Error(error.message);
    const user = await syncSession(data.session);
    if (!user) throw new Error('Could not establish session after Google sign-in.');
    return user;
  }, [syncSession]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; phone?: string; avatar_url?: string }) => {
    if (!authUser?.id) throw new Error('You must be logged in to update profile.');
    
    const payload = {
      id: String(authUser.id),
      name: updates.name ?? authUser.name ?? null,
      phone: updates.phone ?? authUser.phone ?? null,
      avatar_url: updates.avatar_url ?? authUser.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw new Error(error.message);

    const { data: { session: activeSession } } = await supabase.auth.getSession();
    const refreshed = await syncSession(activeSession);
    if (!refreshed) throw new Error('Profile updated but session refresh failed.');
    
    return refreshed;
  }, [authUser, syncSession]);

  const refreshUser = useCallback(async () => {
    const { data: { session: activeSession } } = await supabase.auth.getSession();
    return syncSession(activeSession);
  }, [syncSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: authUser,
    token: session?.access_token || null,
    loading,
    isAuthenticated: !!session?.access_token,
    isAdmin: authUser?.role === 'admin',
    signup,
    login,
    adminLogin,
    signInWithGoogle,
    logout,
    refreshUser,
    updateProfile,
  }), [authUser, session, loading, signup, login, adminLogin, signInWithGoogle, logout, refreshUser, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
