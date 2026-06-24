-- Endurecer RPCs admin, corregir referencias a profiles → habitus_profiles,
-- y restringir lectura masiva de invitaciones de grupo.

-- ============================================================================
-- 1. habitus_admin_get_users_with_email — solo admins
-- ============================================================================

CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email(p_limit integer DEFAULT 500)
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  account_role text,
  is_admin boolean,
  is_discoverable boolean,
  identity_status text,
  profile_score integer,
  suspended_at timestamp with time zone,
  deleted_at timestamp with time zone,
  onboarding_completed_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.email, '') AS email,
    COALESCE(p.display_name, '') AS display_name,
    COALESCE(p.account_role::text, '') AS account_role,
    COALESCE(p.is_admin, false) AS is_admin,
    COALESCE(p.is_discoverable, false) AS is_discoverable,
    COALESCE(p.identity_status::text, 'none') AS identity_status,
    COALESCE(p.profile_score, 0) AS profile_score,
    p.suspended_at,
    p.deleted_at,
    p.onboarding_completed_at,
    p.created_at
  FROM public.habitus_profiles p
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 500), 1), 500);
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_admin_get_users_with_email(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO service_role;

-- ============================================================================
-- 2. admin_get_rooms_with_assignments — check admin + habitus_profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_rooms_with_assignments()
RETURNS TABLE (
  room_id uuid,
  room_name text,
  room_type text,
  price_monthly numeric,
  listing_id uuid,
  listing_name text,
  listing_city text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  host_id uuid,
  host_name text,
  host_email text,
  assigned_at timestamptz,
  assigned_by_name text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id AS room_id,
    r.name AS room_name,
    r.room_type AS room_type,
    r.price_monthly AS price_monthly,
    r.listing_id AS listing_id,
    l.name AS listing_name,
    l.city AS listing_city,
    l.owner_profile_id AS owner_id,
    p_owner.display_name AS owner_name,
    p_owner.email AS owner_email,
    a.host_profile_id AS host_id,
    p_host.display_name AS host_name,
    p_host.email AS host_email,
    a.assigned_at AS assigned_at,
    p_assigned_by.display_name AS assigned_by_name,
    a.is_active AS is_active
  FROM public.habitus_rooms r
  JOIN public.habitus_listings l ON l.id = r.listing_id
  JOIN public.habitus_profiles p_owner ON p_owner.id = l.owner_profile_id
  LEFT JOIN public.habitus_room_assignments a ON a.room_id = r.id AND a.is_active = true
  LEFT JOIN public.habitus_profiles p_host ON p_host.id = a.host_profile_id
  LEFT JOIN public.habitus_profiles p_assigned_by ON p_assigned_by.id = a.assigned_by
  WHERE r.is_active = true
  ORDER BY l.city, l.name, r.name;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_rooms_with_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_rooms_with_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_rooms_with_assignments() TO service_role;

-- ============================================================================
-- 3. Corregir admin_assign/create/update/remove — habitus_profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_assign_room_host(
  p_room_id uuid,
  p_host_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_listing_id uuid;
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requiere permisos de administrador');
  END IF;

  SELECT r.id, r.listing_id, l.owner_profile_id
  INTO v_room_id, v_listing_id, v_owner_id
  FROM public.habitus_rooms r
  JOIN public.habitus_listings l ON l.id = r.listing_id
  WHERE r.id = p_room_id AND r.is_active = true;

  IF v_room_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Habitación no encontrada');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.habitus_profiles WHERE id = p_host_profile_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil de anfitrión no encontrado');
  END IF;

  UPDATE public.habitus_room_assignments
  SET is_active = false
  WHERE room_id = p_room_id AND is_active = true;

  INSERT INTO public.habitus_room_assignments (room_id, host_profile_id, assigned_by)
  VALUES (p_room_id, p_host_profile_id, auth.uid());

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'host_id', p_host_profile_id,
    'listing_id', v_listing_id,
    'owner_id', v_owner_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_room_host(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requiere permisos de administrador');
  END IF;

  UPDATE public.habitus_room_assignments
  SET is_active = false
  WHERE room_id = p_room_id AND is_active = true;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'No hay asignación activa para esta habitación');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_room(
  p_listing_id uuid,
  p_name text,
  p_room_type text,
  p_price_monthly numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requiere permisos de administrador');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.habitus_listings WHERE id = p_listing_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing no encontrado');
  END IF;

  INSERT INTO public.habitus_rooms (listing_id, name, room_type, price_monthly)
  VALUES (p_listing_id, p_name, p_room_type, p_price_monthly)
  RETURNING id INTO v_room_id;

  RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'listing_id', p_listing_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_room(
  p_room_id uuid,
  p_name text DEFAULT NULL,
  p_room_type text DEFAULT NULL,
  p_price_monthly numeric DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.habitus_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requiere permisos de administrador');
  END IF;

  UPDATE public.habitus_rooms
  SET
    name = COALESCE(p_name, name),
    room_type = COALESCE(p_room_type, room_type),
    price_monthly = COALESCE(p_price_monthly, price_monthly),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_room_id;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'room_id', p_room_id);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Habitación no encontrada');
END;
$$;

-- ============================================================================
-- 4. Invitaciones de grupo — restringir SELECT masivo
-- ============================================================================

DROP POLICY IF EXISTS "group_invites_select_anyone" ON public.habitus_group_invites;

CREATE POLICY "group_invites_select_authorized"
  ON public.habitus_group_invites FOR SELECT
  USING (
    public.habitus_is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_groups g
      WHERE g.id = habitus_group_invites.grupo_id
        AND g.creator_id = auth.uid()
    )
  );

-- RPC segura: vista previa de invitación por token (sin listar todas)
CREATE OR REPLACE FUNCTION public.habitus_preview_group_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', i.id,
    'grupo_id', i.grupo_id,
    'token', i.token,
    'max_uses', i.max_uses,
    'uses_count', i.uses_count,
    'expires_at', i.expires_at,
    'grupo', jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'notes', g.notes,
      'creator_id', g.creator_id,
      'target_members', g.target_members
    )
  )
  INTO v_result
  FROM public.habitus_group_invites i
  JOIN public.habitus_groups g ON g.id = i.grupo_id
  WHERE i.token = p_token
    AND i.expires_at > NOW()
    AND i.uses_count < i.max_uses;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_preview_group_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_preview_group_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_preview_group_invite(text) TO service_role;

-- RPC segura: usar invitación (crear join request + incrementar usos)
CREATE OR REPLACE FUNCTION public.habitus_use_group_invite_token(
  p_token text,
  p_mensaje text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.habitus_group_invites%ROWTYPE;
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT * INTO v_invite
  FROM public.habitus_group_invites
  WHERE token = p_token
    AND expires_at > NOW()
    AND uses_count < max_uses
  FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido o expirado');
  END IF;

  INSERT INTO public.habitus_group_join_requests (
    grupo_id, solicitante_id, mensaje, estado
  ) VALUES (
    v_invite.grupo_id,
    auth.uid(),
    COALESCE(NULLIF(trim(p_mensaje), ''), 'Solicitud mediante enlace de invitación'),
    'pending'
  )
  RETURNING id INTO v_request_id;

  UPDATE public.habitus_group_invites
  SET uses_count = uses_count + 1
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'grupo_id', v_invite.grupo_id,
    'join_request_id', v_request_id
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya tienes una solicitud pendiente para este grupo');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_use_group_invite_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_use_group_invite_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_use_group_invite_token(text, text) TO service_role;
