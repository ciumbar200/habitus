-- Ensure demo admin users have is_admin flag set
-- This fixes the admin dashboard test by ensuring demo-admin has proper access

UPDATE public.habitus_profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'demo-admin@e2e.habitus.local',
    'valibuibar@gmail.com'
  )
) AND is_admin IS DISTINCT FROM true;
