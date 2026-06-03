-- Fix admin RLS bypass for tables returning 500 errors
-- This ensures admin can query all tables without RLS errors

-- Fix habitus_listings admin policies (ensure they exist and work)
DROP POLICY IF EXISTS habitus_listings_admin_read ON public.habitus_listings;
CREATE POLICY habitus_listings_admin_read ON public.habitus_listings
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

-- Fix habitus_applications admin policies
DROP POLICY IF EXISTS habitus_applications_admin_read ON public.habitus_applications;
CREATE POLICY habitus_applications_admin_read ON public.habitus_applications
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

-- Ensure admin_introductions has admin policy
DROP POLICY IF EXISTS admin_introductions_admin_read ON public.admin_introductions;
CREATE POLICY admin_introductions_admin_read ON public.admin_introductions
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

-- Ensure admin_introductions has admin policy
-- Note: table already exists from migration 20260529100000_admin_command_center.sql
-- Just ensuring admin can read it
