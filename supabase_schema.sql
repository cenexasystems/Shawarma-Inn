-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor → New Query → Run
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- ==========================================================

-- 1. PROFILES  (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  google_id     TEXT UNIQUE,
  provider      TEXT DEFAULT 'email',
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add role column if schema was already created without it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  address       TEXT NOT NULL,
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  phone         TEXT,
  hours         TEXT,
  image_url     TEXT,
  map_url       TEXT,
  is_flagship   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  category      TEXT NOT NULL,
  image_url     TEXT,
  rating        NUMERIC(3,1) DEFAULT 4.5,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id        UUID REFERENCES public.branches(id),
  delivery_address TEXT,
  customer_name    TEXT,
  customer_phone   TEXT,
  subtotal         NUMERIC(10,2) NOT NULL,
  gst              NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  status           TEXT DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID REFERENCES public.menu_items(id),
  name          TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1,
  subtotal      NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED
);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches        DISABLE ROW LEVEL SECURITY;

-- Helper: check if the calling user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies before recreating (safe re-run)
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- PROFILES: users see/edit their own row; admins see all
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile BUT cannot change their own role
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      -- role field must remain unchanged for non-admins
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    )
  );
-- Admins can update any profile (including role changes)
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "addr_select_own" ON public.saved_addresses;
DROP POLICY IF EXISTS "addr_insert_own" ON public.saved_addresses;
DROP POLICY IF EXISTS "addr_update_own" ON public.saved_addresses;
DROP POLICY IF EXISTS "addr_delete_own" ON public.saved_addresses;

CREATE POLICY "addr_select_own" ON public.saved_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addr_insert_own" ON public.saved_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addr_update_own" ON public.saved_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addr_delete_own" ON public.saved_addresses FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_select_own"  ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own"  ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;

CREATE POLICY "orders_select_own"   ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "orders_insert_own"   ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_select_admin" ON public.orders FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_select_own"  ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own"  ON public.order_items;

CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ==========================================================
-- TRIGGER: auto-upsert profile on new auth user
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, avatar_url, provider, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================================
-- GRANT ADMIN ROLE
-- To make a user admin, run this after they sign up:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE id = '<paste-user-uuid-here>';
--
-- Find the UUID in: Supabase Dashboard → Authentication → Users
-- ==========================================================
