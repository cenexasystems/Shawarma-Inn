-- ==========================================================
-- SHAWARMA INN — Supabase PostgreSQL Schema Migration 010
-- Menu & category image uploads (moves the admin image upload
-- off the Express /admin/upload endpoint, which required the
-- local server and never persisted on Vercel's ephemeral
-- serverless filesystem)
-- ==========================================================

-- Storage bucket for menu item + category images (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "menu_images_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_storage_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_storage_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_storage_admin_delete" ON storage.objects;

CREATE POLICY "menu_images_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_storage_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "menu_images_storage_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "menu_images_storage_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images' AND public.is_admin());
