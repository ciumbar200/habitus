-- Admin RLS for habitus_applications
--
-- Bug: the only SELECT/UPDATE policies on habitus_applications were scoped to
--   (profile_id = auth.uid() OR habitus_can_manage_listing(listing_id))
-- so an admin who is neither the applicant nor the listing manager saw ZERO
-- applications. This left the admin "Solicitudes" page and the dashboard funnel
-- (applicationsCreated, matchesSent, …) empty even though rows existed.
--
-- Fix: add a single ALL policy gated on habitus_is_admin(), mirroring the
-- admin_reports_all pattern already used on habitus_reports. This grants admins
-- read + update + delete on every application without touching the existing
-- owner/manager policies.

DROP POLICY IF EXISTS habitus_applications_admin_all ON public.habitus_applications;

CREATE POLICY habitus_applications_admin_all
  ON public.habitus_applications
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (habitus_is_admin())
  WITH CHECK (habitus_is_admin());
