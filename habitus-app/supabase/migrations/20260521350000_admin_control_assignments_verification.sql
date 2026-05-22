-- Admin: asignación de anfitriones y políticas de control

CREATE TABLE IF NOT EXISTS public.habitus_listing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  host_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.habitus_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS habitus_listing_assignments_host_idx
  ON public.habitus_listing_assignments (host_profile_id);

ALTER TABLE public.habitus_listing_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_assignments_admin_all ON public.habitus_listing_assignments;
CREATE POLICY habitus_assignments_admin_all ON public.habitus_listing_assignments
  FOR ALL
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_assignments_read ON public.habitus_listing_assignments;
CREATE POLICY habitus_assignments_read ON public.habitus_listing_assignments
  FOR SELECT
  USING (
    host_profile_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.habitus_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.habitus_listings l
      WHERE l.id = habitus_listing_assignments.listing_id
        AND l.owner_profile_id = auth.uid()
    )
  );

COMMENT ON TABLE public.habitus_listing_assignments IS
  'Anfitrión asignado por admin a un piso de propietario/agencia.';
