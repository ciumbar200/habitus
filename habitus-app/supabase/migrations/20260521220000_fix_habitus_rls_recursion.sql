-- Corrige recursión infinita RLS (listings <-> assignments) y políticas con typos.

DROP POLICY IF EXISTS habitus_listings_read ON public.habitus_listings;
CREATE POLICY habitus_listings_read ON public.habitus_listings
  FOR SELECT
  USING (
    status = 'published'::habitus_listing_status
    OR owner_profile_id = auth.uid()
    OR host_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.habitus_listing_assignments a
      WHERE a.listing_id = habitus_listings.id
        AND a.host_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS habitus_listings_update ON public.habitus_listings;
CREATE POLICY habitus_listings_update ON public.habitus_listings
  FOR UPDATE
  USING (
    owner_profile_id = auth.uid()
    OR host_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.habitus_listing_assignments a
      WHERE a.listing_id = habitus_listings.id
        AND a.host_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS habitus_assignments_read ON public.habitus_listing_assignments;
CREATE POLICY habitus_assignments_read ON public.habitus_listing_assignments
  FOR SELECT
  USING (
    host_profile_id = auth.uid()
    OR assigned_by = auth.uid()
  );

DROP POLICY IF EXISTS habitus_cp_read ON public.habitus_conversation_participants;
CREATE POLICY habitus_cp_read ON public.habitus_conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.habitus_conversation_participants cp
      WHERE cp.conversation_id = habitus_conversation_participants.conversation_id
        AND cp.profile_id = auth.uid()
    )
  );
