-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema Migration 006
-- Testimonial Videos (moves the admin video feature off the
-- old local-disk + SQLite backend, which never persisted on
-- Vercel's ephemeral serverless filesystem)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.testimonial_videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  url            TEXT NOT NULL,
  thumbnail_url  TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testimonial_videos_select_all" ON public.testimonial_videos;
DROP POLICY IF EXISTS "testimonial_videos_admin_all" ON public.testimonial_videos;
CREATE POLICY "testimonial_videos_select_all" ON public.testimonial_videos FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "testimonial_videos_admin_all" ON public.testimonial_videos USING (public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_testimonial_videos_modtime') THEN
    CREATE TRIGGER update_testimonial_videos_modtime BEFORE UPDATE ON public.testimonial_videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- Storage bucket for video files + thumbnails (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "testimonial_videos_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "testimonial_videos_storage_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "testimonial_videos_storage_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "testimonial_videos_storage_admin_delete" ON storage.objects;

CREATE POLICY "testimonial_videos_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-videos');

CREATE POLICY "testimonial_videos_storage_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'testimonial-videos' AND public.is_admin());

CREATE POLICY "testimonial_videos_storage_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'testimonial-videos' AND public.is_admin());

CREATE POLICY "testimonial_videos_storage_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'testimonial-videos' AND public.is_admin());
