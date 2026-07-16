-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema Migration 007
-- Enable realtime on profiles so the Admin Access page reflects
-- new signups / role / status changes live, without a manual reload.
-- ==========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
