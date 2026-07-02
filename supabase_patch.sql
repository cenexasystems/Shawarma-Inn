-- ================================================================
-- SHAWARMA INN — Supabase Schema Patch
-- Run this in Supabase SQL Editor BEFORE running the migration script
-- ================================================================

-- Add missing columns to menu_items that our app requires
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS slug          TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS large_price   NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg        BOOLEAN DEFAULT FALSE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_trending   BOOLEAN DEFAULT FALSE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE;

-- Rename is_available to is_available (keep both for compatibility)
-- is_available already exists from original schema
-- is_active is an alias — sync them via a trigger

-- Create/replace a view that the frontend uses
-- (This ensures both is_available and is_active work the same way)
CREATE OR REPLACE VIEW public.menu_items_active AS
  SELECT * FROM public.menu_items 
  WHERE is_available = TRUE OR is_active = TRUE;

-- Also add to categories table the fields our ERP uses
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_visible    BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  banner_image  TEXT,
  category_image TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Grant public read access to menu items (no auth needed)
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

-- Grant service role full access to admin operations
GRANT ALL ON public.menu_items TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
