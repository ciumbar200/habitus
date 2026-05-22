-- Demo-ready: bucket listados, helper admin, RLS moderación, tabla reportes

-- Helper admin (SECURITY DEFINER evita recursión en RLS de profiles)
CREATE OR REPLACE FUNCTION public.habitus_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.habitus_profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_is_admin() TO authenticated;

-- Reportes (si no existe en el proyecto remoto)
CREATE TABLE IF NOT EXISTS public.habitus_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.habitus_profiles(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('profile', 'listing', 'message')),
  target_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.habitus_reports ENABLE ROW LEVEL SECURITY;

-- Bucket imágenes de espacios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'habitus-listings',
  'habitus-listings',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS habitus_listings_storage_public_read ON storage.objects;
CREATE POLICY habitus_listings_storage_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'habitus-listings');

DROP POLICY IF EXISTS habitus_listings_storage_auth_insert ON storage.objects;
CREATE POLICY habitus_listings_storage_auth_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'habitus-listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS habitus_listings_storage_auth_update ON storage.objects;
CREATE POLICY habitus_listings_storage_auth_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'habitus-listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS habitus_listings_storage_auth_delete ON storage.objects;
CREATE POLICY habitus_listings_storage_auth_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'habitus-listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin: perfiles
DROP POLICY IF EXISTS habitus_profiles_admin_read ON public.habitus_profiles;
CREATE POLICY habitus_profiles_admin_read ON public.habitus_profiles
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_profiles_admin_update ON public.habitus_profiles;
CREATE POLICY habitus_profiles_admin_update ON public.habitus_profiles
  FOR UPDATE TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Admin: espacios (ver borradores y moderar)
DROP POLICY IF EXISTS habitus_listings_admin_read ON public.habitus_listings;
CREATE POLICY habitus_listings_admin_read ON public.habitus_listings
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_listings_admin_update ON public.habitus_listings;
CREATE POLICY habitus_listings_admin_update ON public.habitus_listings
  FOR UPDATE TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Reportes: cualquier usuario autenticado puede denunciar; admin gestiona
DROP POLICY IF EXISTS habitus_reports_insert ON public.habitus_reports;
CREATE POLICY habitus_reports_insert ON public.habitus_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS habitus_reports_admin_read ON public.habitus_reports;
CREATE POLICY habitus_reports_admin_read ON public.habitus_reports
  FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_reports_admin_update ON public.habitus_reports;
CREATE POLICY habitus_reports_admin_update ON public.habitus_reports
  FOR UPDATE TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());
