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

-- The `categories` table itself (columns, RLS) is created by
-- supabase_migrations/004_erp_rebuild.sql — do not redefine it here.
-- A second, differently-shaped `CREATE TABLE IF NOT EXISTS categories`
-- used to live in this file; whichever script ran first silently won,
-- leaving the other's column names (is_active/display_order vs.
-- is_visible/banner_image) unusable depending on execution order.

-- Grant public read access to menu items (no auth needed)
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

-- Grant service role full access to admin operations
GRANT ALL ON public.menu_items TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
