-- ==========================================================
-- MIGRATION 002 — Orders
-- Run AFTER 001_auth.sql
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ==========================================================

-- ── 1. ORDERS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivery_address TEXT,
  delivery_type   TEXT NOT NULL DEFAULT 'store_pickup',
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_email  TEXT,
  coupon_code     TEXT,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst             NUMERIC(10,2) DEFAULT 0,
  packing_charge  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table existed from an earlier schema version
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type   TEXT NOT NULL DEFAULT 'store_pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code     TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packing_charge  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraints safely
DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_delivery_type_check
    CHECK (delivery_type IN ('home_delivery', 'store_pickup'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending','processing','completed','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. ORDER ITEMS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID,
  name         TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  subtotal     NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED
);

-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select"       ON public.orders;
DROP POLICY IF EXISTS "orders_select_own"   ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own"   ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;

CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

CREATE POLICY "order_items_select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- ==========================================================
