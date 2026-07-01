const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

export const useSupabaseAuth = (import.meta.env.VITE_AUTH_MODE as string | undefined)?.trim() === 'supabase';

export const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE);

export const useLocalApi = isLocalHost || hasExplicitApiBase;

export const canUseAdminApi = useLocalApi;
