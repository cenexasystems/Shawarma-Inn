import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseConfig } from './supabaseConfig';

if (!hasSupabaseConfig) {
  console.warn('[Supabase] Missing env vars — using placeholder client.');
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
