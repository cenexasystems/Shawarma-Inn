-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema Migration 008
-- Backfill public.categories from the distinct category values
-- already present on menu_items.
--
-- The categories table (migration 004) was created but never
-- seeded, so it's been empty since it was added -- the storefront
-- menu still works because it derives its category tabs directly
-- from menu_items.category (text), but the admin Categories page
-- and the "Category" dropdown in the add/edit menu item drawer both
-- read from this table, so they showed "No categories found" / an
-- empty dropdown even though categories clearly exist on the menu.
-- ==========================================================

INSERT INTO public.categories (name, display_order, is_active)
SELECT
  category AS name,
  ROW_NUMBER() OVER (ORDER BY category) AS display_order,
  TRUE AS is_active
FROM public.menu_items
WHERE category IS NOT NULL AND category <> ''
GROUP BY category
ON CONFLICT (name) DO NOTHING;
