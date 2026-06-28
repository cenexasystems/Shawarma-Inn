-- ==========================================================
-- MIGRATION 001 — Auth / Profiles
-- Run this FIRST in Supabase SQL Editor → New Query → Run
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / IF EXISTS
-- ==========================================================

-- ── 1. PROFILES TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  google_id   TEXT,
  provider    TEXT DEFAULT 'email',
  role        TEXT NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns that may be missing if schema was created earlier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_id   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role        TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint on role (safe: will error if constraint already exists by same name,
-- so we use a DO block to skip if it already exists)
DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Unique constraint on google_id (allow multiple NULLs — only one google_id per account)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS profiles_google_id_unique
    ON public.profiles (google_id)
    WHERE google_id IS NOT NULL;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- ── 2. ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop and recreate policies (safe re-run)
DROP POLICY IF EXISTS "profiles_select"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own row but cannot escalate their own role
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      OR public.is_admin()
    )
  );

-- Admins can update anyone (including role changes)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ── 3. TRIGGER: create profile on new auth user ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, avatar_url, provider, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'email'),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    name       = COALESCE(EXCLUDED.name, profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block auth signup if profile sync fails.
    -- The app will upsert the profile on first login.
    RAISE WARNING 'handle_new_user failed for uid=%: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 4. GRANT ADMIN ROLE ─────────────────────────────────────
-- After a user signs up, run this to make them admin:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE id = '<paste-user-uuid-here>';
--
-- Find the UUID: Supabase Dashboard → Authentication → Users
-- ==========================================================
