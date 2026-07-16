-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema Migration 004
-- ERP Rebuild & Additional Tables
-- ==========================================================

-- 1. PROFILES UPDATES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  banner_url    TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive: if `categories` already exists from an older patch script
-- (which used is_visible/sort_order/banner_image/category_image), bring
-- it up to the column names the app actually reads/writes.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS banner_url    TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url     TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'is_visible') THEN
    UPDATE public.categories SET is_active = is_visible WHERE is_active IS DISTINCT FROM is_visible;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'sort_order') THEN
    UPDATE public.categories SET display_order = sort_order WHERE display_order IS DISTINCT FROM sort_order;
  END IF;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories USING (public.is_admin());

-- 3. MENU ITEMS UPDATES
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS trending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- 4. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount    NUMERIC(10,2),
  valid_from      TIMESTAMPTZ DEFAULT NOW(),
  valid_to        TIMESTAMPTZ,
  usage_limit     INT,
  used_count      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_select_all" ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "coupons_admin_all" ON public.coupons USING (public.is_admin());

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  menu_item_id  UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  is_visible    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (is_visible = true OR public.is_admin());
CREATE POLICY "reviews_insert_auth" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all" ON public.reviews USING (public.is_admin());

-- 6. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  entity        TEXT NOT NULL,
  entity_id     UUID,
  details       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_admin_all" ON public.activity_logs USING (public.is_admin());

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('order', 'system', 'customer', 'admin')),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  link          TEXT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system-wide/admin notifications
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (target_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (target_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_admin_all" ON public.notifications USING (public.is_admin());

-- 8. SETTINGS (Singleton Table)
CREATE TABLE IF NOT EXISTS public.settings (
  id                TEXT PRIMARY KEY DEFAULT 'global',
  whatsapp_number   TEXT,
  business_hours    JSONB,
  delivery_charges  NUMERIC(10,2) DEFAULT 0,
  gst_percentage    NUMERIC(10,2) DEFAULT 5,
  social_links      JSONB,
  seo               JSONB,
  audio_settings    JSONB,
  brand_assets      JSONB,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_all" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_all" ON public.settings USING (public.is_admin());

-- Insert default settings row if it doesn't exist
INSERT INTO public.settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- 9. NOTIFICATION & ACTIVITY TRIGGERS
-- Realtime triggers for orders
-- Check if publication exists before creating or adding table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- Helper to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach update triggers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_modtime') THEN
    CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coupons_modtime') THEN
    CREATE TRIGGER update_coupons_modtime BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_modtime') THEN
    CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;
