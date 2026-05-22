-- Amenities e imágenes de anuncios: anfitrión/propietario puede gestionar su listing

CREATE OR REPLACE FUNCTION public.habitus_can_manage_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.habitus_listings l
    WHERE l.id = p_listing_id
      AND (
        l.owner_profile_id = auth.uid()
        OR l.host_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.habitus_listing_assignments a
          WHERE a.listing_id = l.id AND a.host_profile_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_can_manage_listing(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_can_manage_listing(uuid) TO authenticated;

-- Amenities
DROP POLICY IF EXISTS habitus_listing_amenities_insert ON public.habitus_listing_amenities;
CREATE POLICY habitus_listing_amenities_insert ON public.habitus_listing_amenities
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_can_manage_listing(listing_id));

DROP POLICY IF EXISTS habitus_listing_amenities_delete ON public.habitus_listing_amenities;
CREATE POLICY habitus_listing_amenities_delete ON public.habitus_listing_amenities
  FOR DELETE TO authenticated
  USING (public.habitus_can_manage_listing(listing_id));

DROP POLICY IF EXISTS habitus_listing_amenities_update ON public.habitus_listing_amenities;
CREATE POLICY habitus_listing_amenities_update ON public.habitus_listing_amenities
  FOR UPDATE TO authenticated
  USING (public.habitus_can_manage_listing(listing_id))
  WITH CHECK (public.habitus_can_manage_listing(listing_id));

-- Imágenes (INSERT ya existía; DELETE solo owner bloqueaba anfitriones en edición)
DROP POLICY IF EXISTS habitus_listing_images_insert ON public.habitus_listing_images;
CREATE POLICY habitus_listing_images_insert ON public.habitus_listing_images
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_can_manage_listing(listing_id));

DROP POLICY IF EXISTS habitus_listing_images_delete ON public.habitus_listing_images;
CREATE POLICY habitus_listing_images_delete ON public.habitus_listing_images
  FOR DELETE TO authenticated
  USING (public.habitus_can_manage_listing(listing_id));

DROP POLICY IF EXISTS habitus_listing_images_update ON public.habitus_listing_images;
CREATE POLICY habitus_listing_images_update ON public.habitus_listing_images
  FOR UPDATE TO authenticated
  USING (public.habitus_can_manage_listing(listing_id))
  WITH CHECK (public.habitus_can_manage_listing(listing_id));
