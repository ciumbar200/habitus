-- Anfitriones pueden crear/publicar habitaciones (403 en INSERT)

DROP POLICY IF EXISTS habitus_listings_insert ON public.habitus_listings;
CREATE POLICY habitus_listings_insert ON public.habitus_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habitus_profiles p
      WHERE p.id = auth.uid()
        AND (
          p.account_role IN ('propietario', 'agencia')
          OR (p.account_role = 'anfitrion' AND host_profile_id = auth.uid())
        )
    )
  );
