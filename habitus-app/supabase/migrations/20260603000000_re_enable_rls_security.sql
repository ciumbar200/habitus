-- Re-enable RLS on tables that were temporarily disabled during debugging
-- CRITICAL SECURITY FIX: Restores proper Row Level Security policies
--
-- This migration reverses the temporary RLS bypass from migrations:
-- - 20260530240000_bypass_rls_temp.sql
-- - 20260530250000_disable_rls_temp.sql

-- Re-enable RLS on habitus_listings
ALTER TABLE public.habitus_listings ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on habitus_applications
ALTER TABLE public.habitus_applications ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on admin_introductions
ALTER TABLE public.admin_introductions ENABLE ROW LEVEL SECURITY;

-- Verify admin policies still exist and are properly configured
-- These were created in migration 20260530230000_fix_admin_rls_bypass.sql

-- habitus_listings admin policies
DROP POLICY IF EXISTS habitus_listings_admin_read ON public.habitus_listings;
CREATE POLICY habitus_listings_admin_read ON public.habitus_listings
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

-- habitus_applications admin policies
DROP POLICY IF EXISTS habitus_applications_admin_read ON public.habitus_applications;
CREATE POLICY habitus_applications_admin_read ON public.habitus_applications
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

-- admin_introductions admin policies
DROP POLICY IF EXISTS admin_introductions_admin_read ON public.admin_introductions;
CREATE POLICY admin_introductions_admin_read ON public.admin_introductions
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());
