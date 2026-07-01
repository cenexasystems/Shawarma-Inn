-- ==========================================================
-- MIGRATION 003 — Order Workflow: Status History + Activity Log
-- Run AFTER 002_orders.sql
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE
-- ==========================================================

-- ── 1. ORDER STATUS HISTORY ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  status          TEXT NOT NULL,
  changed_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. ACTIVITY LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. AUTO-SET updated_at ON orders ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 4. TRIGGER: record status history + activity on UPDATE ───
CREATE OR REPLACE FUNCTION public.record_order_status_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, previous_status, status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    INSERT INTO public.activity_log (event_type, entity_type, entity_id, actor_id, payload)
    VALUES (
      'order_status_changed',
      'order',
      NEW.id::text,
      auth.uid(),
      jsonb_build_object(
        'order_id',       NEW.id,
        'from_status',    OLD.status,
        'to_status',      NEW.status,
        'customer_name',  NEW.customer_name,
        'total',          NEW.total
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.record_order_status_history();

-- ── 5. TRIGGER: record activity on new order INSERT ──────────
CREATE OR REPLACE FUNCTION public.record_new_order_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activity_log (event_type, entity_type, entity_id, actor_id, payload)
  VALUES (
    'order_placed',
    'order',
    NEW.id::text,
    NEW.user_id,
    jsonb_build_object(
      'order_id',      NEW.id,
      'customer_name', NEW.customer_name,
      'total',         NEW.total,
      'status',        NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.record_new_order_activity();

-- ── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "osh_select"         ON public.order_status_history;
DROP POLICY IF EXISTS "osh_insert_trigger" ON public.order_status_history;

-- Customers see their own order history; admins see all
CREATE POLICY "osh_select"
  ON public.order_status_history FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- SECURITY DEFINER triggers bypass RLS, but this policy covers direct API inserts
CREATE POLICY "osh_insert_trigger"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;

CREATE POLICY "activity_log_select"
  ON public.activity_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "activity_log_insert"
  ON public.activity_log FOR INSERT
  WITH CHECK (true);

-- ── 7. REVENUE VIEW (completed orders only) ──────────────────
-- Revenue ONLY counts when status = 'completed'
CREATE OR REPLACE VIEW public.v_revenue_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'completed')::int                         AS completed_orders,
  COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0)               AS total_revenue,
  COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','completed')), 0) AS pipeline_revenue,
  COUNT(*) FILTER (WHERE status = 'pending')::int                           AS pending_count
FROM public.orders;

-- ==========================================================
