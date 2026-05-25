-- Propietarios/agencias/anfitriones: ver grupos formados e inquilinos sin ser miembros del grupo.

CREATE OR REPLACE FUNCTION public.habitus_is_listing_manager(p_profile_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_listings l
    WHERE l.owner_profile_id = p_profile_id
       OR l.host_profile_id = p_profile_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.habitus_listing_assignments a
    WHERE a.host_profile_id = p_profile_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.habitus_profiles p
    WHERE p.id = p_profile_id
      AND p.account_role IN ('propietario', 'agencia', 'anfitrion')
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_is_listing_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_is_listing_manager(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_manager_listing_cities(p_profile_id uuid DEFAULT auth.uid())
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT lower(city)),
    ARRAY[]::text[]
  )
  FROM (
    SELECT l.city
    FROM public.habitus_listings l
    WHERE (l.owner_profile_id = p_profile_id OR l.host_profile_id = p_profile_id)
      AND l.city IS NOT NULL
    UNION
    SELECT l.city
    FROM public.habitus_listing_assignments a
    JOIN public.habitus_listings l ON l.id = a.listing_id
    WHERE a.host_profile_id = p_profile_id
      AND l.city IS NOT NULL
  ) cities;
$$;

REVOKE ALL ON FUNCTION public.habitus_manager_listing_cities(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_manager_listing_cities(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_manager_can_view_group(p_group_id uuid, p_manager_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.habitus_is_listing_manager(p_manager_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.habitus_groups g
        WHERE g.id = p_group_id
          AND g.status IN ('ready', 'active')
          AND lower(g.city) = ANY(public.habitus_manager_listing_cities(p_manager_id))
          AND public.habitus_group_confirmed_count(g.id) >= g.target_members
      )
      OR EXISTS (
        SELECT 1
        FROM public.habitus_applications app
        JOIN public.habitus_listings l ON l.id = app.listing_id
        WHERE app.group_id = p_group_id
          AND (l.owner_profile_id = p_manager_id OR l.host_profile_id = p_manager_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.habitus_listing_access acc
        JOIN public.habitus_listings l ON l.id = acc.listing_id
        WHERE acc.group_id = p_group_id
          AND (l.owner_profile_id = p_manager_id OR l.host_profile_id = p_manager_id)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.habitus_manager_can_view_group(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_manager_can_view_group(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_formed_groups_for_manager(p_city text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cities text[];
  v_result json;
BEGIN
  IF v_uid IS NULL OR NOT public.habitus_is_listing_manager(v_uid) THEN
    RETURN '[]'::json;
  END IF;

  v_cities := public.habitus_manager_listing_cities(v_uid);
  IF v_cities IS NULL OR array_length(v_cities, 1) IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.name), '[]'::json) INTO v_result
  FROM (
    SELECT
      g.id,
      g.slug,
      g.name,
      g.city,
      g.zone,
      g.status::text AS status,
      g.target_members AS "targetMembers",
      public.habitus_group_confirmed_count(g.id) AS "memberCount"
    FROM public.habitus_groups g
    WHERE g.status IN ('ready', 'active')
      AND public.habitus_group_confirmed_count(g.id) >= g.target_members
      AND lower(g.city) = ANY(v_cities)
      AND (p_city IS NULL OR p_city = '' OR lower(g.city) = lower(p_city))
    ORDER BY g.name
    LIMIT 50
  ) t;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_formed_groups_for_manager(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_formed_groups_for_manager(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_manager_group_members(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_result json;
BEGIN
  IF v_uid IS NULL OR NOT public.habitus_manager_can_view_group(p_group_id, v_uid) THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."joinedAt"), '[]'::json) INTO v_result
  FROM (
    SELECT
      gm.profile_id AS "profileId",
      p.display_name AS "displayName",
      COALESCE(p.slug, gm.profile_id::text) AS slug,
      p.avatar_url AS "avatarUrl",
      gm.role AS "groupRole",
      gm.is_confirmed AS "isConfirmed",
      gm.joined_at AS "joinedAt"
    FROM public.habitus_group_members gm
    JOIN public.habitus_profiles p ON p.id = gm.profile_id
    WHERE gm.group_id = p_group_id
      AND gm.is_confirmed = true
  ) t;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_manager_group_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_manager_group_members(uuid) TO authenticated;
