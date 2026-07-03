-- ==========================================================
-- MIGRATION 005 — Sequential Order Numbers
-- Run AFTER 002_orders.sql (and 004_erp_rebuild.sql)
-- Safe to re-run: uses IF NOT EXISTS / backfills only NULL rows
-- ==========================================================

-- The app displays orders as "#1234" via orders.order_number,
-- but no earlier migration ever added this column.

CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INT;

-- Backfill any existing orders that don't have a number yet,
-- numbering them in creation order so oldest orders get the lowest numbers.
DO $$
DECLARE
  r RECORD;
  n INT := 1;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1 INTO n FROM public.orders;

  FOR r IN
    SELECT id FROM public.orders WHERE order_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.orders SET order_number = n WHERE id = r.id;
    n := n + 1;
  END LOOP;
END $$;

-- Point the sequence past the highest number now in use, so new orders
-- continue counting up instead of colliding with backfilled numbers.
SELECT setval('public.orders_order_number_seq', (SELECT COALESCE(MAX(order_number), 0) FROM public.orders) + 1, false);

ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');
ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON public.orders(order_number);

-- ==========================================================
