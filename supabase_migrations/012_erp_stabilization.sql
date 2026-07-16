-- ==========================================================
-- Migration 012: ERP Stabilization
-- 1. Add order_number to orders
-- 2. Create order_events table for timeline
-- 3. Create auto-trigger for status changes
-- ==========================================================

-- 1. Add sequential order_number to orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'order_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_number BIGINT GENERATED ALWAYS AS IDENTITY;
  END IF;
END $$;

-- 2. Create order_events for activity logs
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_events_select" ON public.order_events;
CREATE POLICY "order_events_select" ON public.order_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "order_events_insert" ON public.order_events;
CREATE POLICY "order_events_insert" ON public.order_events FOR INSERT WITH CHECK (
  public.is_admin() OR auth.uid() IS NOT NULL
);

-- 3. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If this is a new order OR the status changed
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_events (order_id, status, notes, admin_id)
    VALUES (
      NEW.id,
      NEW.status,
      CASE WHEN TG_OP = 'INSERT' THEN 'Order Created' ELSE 'Status updated to ' || NEW.status END,
      CASE WHEN public.is_admin() THEN auth.uid() ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.log_order_status_change();
