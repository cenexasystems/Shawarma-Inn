-- ==========================================================
-- One-off: grant admin role to cenexasystems@gmail.com
-- Run manually in the Supabase SQL Editor. This user must have
-- already signed up (created an account) at least once, since
-- this updates their existing profiles row -- it will not create one.
-- ==========================================================

UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'cenexasystems@gmail.com');

-- Verify it took effect:
-- SELECT p.id, p.name, p.role, u.email
-- FROM public.profiles p JOIN auth.users u ON u.id = p.id
-- WHERE u.email = 'cenexasystems@gmail.com';
