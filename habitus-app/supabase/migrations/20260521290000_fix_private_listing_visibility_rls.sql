-- Pisos privados: no aparecen en Descubrir para cualquier usuario autenticado

DROP POLICY IF EXISTS habitus_listings_read ON public.habitus_listings;
CREATE POLICY habitus_listings_read ON public.habitus_listings
  FOR SELECT
  USING (
    (status = 'published'::habitus_listing_status AND visibility = 'public')
    OR owner_profile_id = auth.uid()
    OR host_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.habitus_listing_assignments a
      WHERE a.listing_id = habitus_listings.id
        AND a.host_profile_id = auth.uid()
    )
  );
