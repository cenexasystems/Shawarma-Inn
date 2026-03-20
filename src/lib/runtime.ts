import { hasSupabaseConfig } from './supabaseConfig';

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

const envAuthMode = (import.meta.env.VITE_AUTH_MODE as string | undefined)?.toLowerCase();

export const useSupabaseAuth = envAuthMode
  ? envAuthMode === 'supabase'
  : !isLocalHost && hasSupabaseConfig;

export const useLocalApi = envAuthMode
  ? envAuthMode === 'local'
  : !useSupabaseAuth;

export const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE);

export const canUseAdminApi = useLocalApi || hasExplicitApiBase;
