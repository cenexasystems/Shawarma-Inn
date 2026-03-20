-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor → New Query → Run
-- ==========================================================

-- 1. PROFILES  (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  google_id     TEXT UNIQUE,
  provider      TEXT DEFAULT 'google',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,          -- e.g. "Home", "Office"
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
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id        UUID REFERENCES public.branches(id),
  delivery_address TEXT,
  customer_name    TEXT,
  customer_phone   TEXT,
  subtotal         NUMERIC(10,2) NOT NULL,
  gst              NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  status           TEXT DEFAULT 'pending',   -- pending | confirmed | delivered | cancelled
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID REFERENCES public.menu_items(id),
  name          TEXT NOT NULL,          -- snapshot at time of order
  price         NUMERIC(10,2) NOT NULL, -- snapshot
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
ALTER TABLE public.menu_items      DISABLE ROW LEVEL SECURITY; -- public read
ALTER TABLE public.branches        DISABLE ROW LEVEL SECURITY; -- public read

-- PROFILES: users can only see/update their own row
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SAVED ADDRESSES: users own their addresses
CREATE POLICY "addr_select_own"  ON public.saved_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addr_insert_own"  ON public.saved_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addr_update_own"  ON public.saved_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addr_delete_own"  ON public.saved_addresses FOR DELETE USING (auth.uid() = user_id);

-- ORDERS: users own their orders
CREATE POLICY "orders_select_own"  ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own"  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS: readable if user owns the parent order
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ==========================================================
-- TRIGGER: auto-upsert profile on new auth user
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    name       = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
