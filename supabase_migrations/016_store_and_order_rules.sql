ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS store_status TEXT NOT NULL DEFAULT 'OPEN';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS opening_time TIME NOT NULL DEFAULT '17:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS closing_time TIME NOT NULL DEFAULT '22:00';
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_store_status_check;
ALTER TABLE public.settings ADD CONSTRAINT settings_store_status_check CHECK (store_status IN ('OPEN', 'CLOSED'));

UPDATE public.orders SET status = CASE
  WHEN status IN ('accepted', 'preparing', 'ready', 'in_transit') THEN 'processing'
  WHEN status IN ('generated', 'paid', 'unpaid') THEN 'pending'
  ELSE status
END;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','processing','completed','cancelled'));

CREATE OR REPLACE FUNCTION public.enforce_store_ordering()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE s TEXT; open_at TIME; close_at TIME; now_at TIME;
BEGIN
  SELECT store_status, opening_time, closing_time INTO s, open_at, close_at FROM public.settings WHERE id = 'global';
  now_at := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time;
  IF COALESCE(s, 'OPEN') <> 'OPEN' OR (open_at <= close_at AND (now_at < open_at OR now_at > close_at)) OR (open_at > close_at AND now_at < open_at AND now_at > close_at) THEN
    RAISE EXCEPTION 'Online ordering is currently unavailable.' USING ERRCODE = 'P0001';
  END IF;
  NEW.delivery_address := COALESCE(NEW.delivery_address, 'Mathur');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_store_ordering_before_insert ON public.orders;
CREATE TRIGGER enforce_store_ordering_before_insert BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_store_ordering();
