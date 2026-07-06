-- =============================================================================
-- Migration 005 — Restaurant Alert System (KDS)
-- =============================================================================

-- Add acknowledged_at to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- kds_settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kds_settings (
  user_id                      UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  sound_url                    TEXT,
  volume                       INTEGER NOT NULL DEFAULT 100 CHECK (volume BETWEEN 0 AND 100),
  repeat_interval_sec          INTEGER NOT NULL DEFAULT 10 CHECK (repeat_interval_sec >= 0),
  is_muted                     BOOLEAN NOT NULL DEFAULT FALSE,
  enable_browser_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kds_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kds_settings_all" ON public.kds_settings;
CREATE POLICY "kds_settings_all" ON public.kds_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
