const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

// Keep authentication in local mode to avoid dependency on Supabase profile triggers.
export const useSupabaseAuth = import.meta.env.VITE_AUTH_MODE === 'supabase';

export const useLocalApi = true;

export const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE);

export const canUseAdminApi = useLocalApi || hasExplicitApiBase;
