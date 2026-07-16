-- ==========================================================
-- Migration 013: Add trending flag to menu items
-- ==========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'menu_items' 
      AND column_name = 'is_trending'
  ) THEN
    ALTER TABLE public.menu_items ADD COLUMN is_trending BOOLEAN DEFAULT false;
  END IF;
END $$;
