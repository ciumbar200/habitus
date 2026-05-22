-- Corrige recursión infinita RLS en habitus_group_members (500 en listings, bookmarks, grupos, applications)

CREATE OR REPLACE FUNCTION public.habitus_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.profile_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_is_group_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_is_group_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_is_group_lead(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.profile_id = auth.uid()
      AND gm.role = 'lead'
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_is_group_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_is_group_lead(uuid) TO authenticated;

-- Grupos: leer sin subconsulta recursiva a group_members
DROP POLICY IF EXISTS habitus_groups_read ON public.habitus_groups;
CREATE POLICY habitus_groups_read ON public.habitus_groups
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR public.habitus_is_group_member(id)
    OR public.habitus_is_admin()
  );

DROP POLICY IF EXISTS habitus_groups_update ON public.habitus_groups;
CREATE POLICY habitus_groups_update ON public.habitus_groups
  FOR UPDATE TO authenticated
  USING (
    creator_id = auth.uid()
    OR public.habitus_is_group_lead(id)
  );

-- Miembros de grupo
DROP POLICY IF EXISTS habitus_group_members_read ON public.habitus_group_members;
CREATE POLICY habitus_group_members_read ON public.habitus_group_members
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.habitus_is_group_member(group_id)
    OR public.habitus_is_admin()
  );

-- Acceso a espacios privados
DROP POLICY IF EXISTS habitus_listing_access_read ON public.habitus_listing_access;
CREATE POLICY habitus_listing_access_read ON public.habitus_listing_access
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR granted_by = auth.uid()
    OR (group_id IS NOT NULL AND public.habitus_is_group_member(group_id))
    OR public.habitus_is_admin()
  );

DROP POLICY IF EXISTS habitus_listings_private_access ON public.habitus_listings;
CREATE POLICY habitus_listings_private_access ON public.habitus_listings
  FOR SELECT TO authenticated
  USING (
    visibility = 'private'
    AND (
      owner_profile_id = auth.uid()
      OR host_profile_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.habitus_listing_access a
        WHERE a.listing_id = habitus_listings.id
          AND (
            a.profile_id = auth.uid()
            OR (a.group_id IS NOT NULL AND public.habitus_is_group_member(a.group_id))
          )
      )
      OR public.habitus_is_admin()
    )
  );
