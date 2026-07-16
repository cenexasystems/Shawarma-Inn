-- Durable KDS notifications. One notification per newly inserted order.
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  notification_sound TEXT NOT NULL DEFAULT '/notification-1.mp3'
);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_notifications_admin_select" ON public.order_notifications;
DROP POLICY IF EXISTS "order_notifications_admin_update" ON public.order_notifications;
CREATE POLICY "order_notifications_admin_select" ON public.order_notifications FOR SELECT USING (public.is_admin());
CREATE POLICY "order_notifications_admin_update" ON public.order_notifications FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.order_notifications (order_id)
  VALUES (NEW.id)
  ON CONFLICT (order_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS create_order_notification_after_insert ON public.orders;
CREATE TRIGGER create_order_notification_after_insert AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.create_order_notification();

CREATE OR REPLACE FUNCTION public.acknowledge_order_notification_on_processing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.order_notifications
    SET is_acknowledged = TRUE, acknowledged_by = auth.uid(), acknowledged_at = NOW()
    WHERE order_id = NEW.id AND is_acknowledged = FALSE;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS acknowledge_order_notification_on_processing ON public.orders;
CREATE TRIGGER acknowledge_order_notification_on_processing AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.acknowledge_order_notification_on_processing();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
  END IF;
END $$;
