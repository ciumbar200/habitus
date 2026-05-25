-- Solicitudes de unión a grupos, auto-marcar grupo formado, preview público

CREATE OR REPLACE FUNCTION public.habitus_group_confirmed_count(p_group_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.habitus_group_members gm
  WHERE gm.group_id = p_group_id AND gm.is_confirmed = true;
$$;

REVOKE ALL ON FUNCTION public.habitus_group_confirmed_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_group_confirmed_count(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_try_mark_group_ready(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target integer;
  v_status text;
  v_count integer;
BEGIN
  SELECT target_members, status INTO v_target, v_status
  FROM public.habitus_groups
  WHERE id = p_group_id;

  IF v_status IS DISTINCT FROM 'forming' THEN
    RETURN;
  END IF;

  v_count := public.habitus_group_confirmed_count(p_group_id);

  IF v_count >= v_target THEN
    UPDATE public.habitus_groups
    SET status = 'ready', updated_at = now()
    WHERE id = p_group_id AND status = 'forming';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_try_mark_group_ready(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_try_mark_group_ready(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_request_join_group(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_target integer;
  v_confirmed integer;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'No autenticado';
  END IF;

  SELECT status, target_members INTO v_status, v_target
  FROM public.habitus_groups
  WHERE id = p_group_id;

  IF v_status IS NULL THEN
    RETURN 'Grupo no encontrado';
  END IF;

  IF v_status <> 'forming' THEN
    RETURN 'Este grupo ya no acepta solicitudes';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.habitus_group_members
    WHERE group_id = p_group_id AND profile_id = v_uid AND is_confirmed = true
  ) THEN
    RETURN 'Ya eres miembro del grupo';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.habitus_group_members
    WHERE group_id = p_group_id AND profile_id = v_uid AND is_confirmed = false
  ) THEN
    RETURN 'Ya tienes una solicitud pendiente';
  END IF;

  v_confirmed := public.habitus_group_confirmed_count(p_group_id);
  IF v_confirmed >= v_target THEN
    RETURN 'El grupo ya está completo';
  END IF;

  INSERT INTO public.habitus_group_members (group_id, profile_id, role, is_confirmed)
  VALUES (p_group_id, v_uid, 'member', false);

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_request_join_group(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_request_join_group(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_accept_group_member(p_group_id uuid, p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target integer;
  v_confirmed integer;
BEGIN
  IF NOT public.habitus_is_group_lead(p_group_id) THEN
    RETURN 'No autorizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.habitus_group_members
    WHERE group_id = p_group_id AND profile_id = p_profile_id AND is_confirmed = false
  ) THEN
    RETURN 'Solicitud no encontrada';
  END IF;

  SELECT target_members INTO v_target FROM public.habitus_groups WHERE id = p_group_id;
  v_confirmed := public.habitus_group_confirmed_count(p_group_id);

  IF v_confirmed >= v_target THEN
    RETURN 'El grupo ya está completo';
  END IF;

  UPDATE public.habitus_group_members
  SET is_confirmed = true
  WHERE group_id = p_group_id AND profile_id = p_profile_id;

  PERFORM public.habitus_try_mark_group_ready(p_group_id);

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_accept_group_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_accept_group_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_reject_group_member(p_group_id uuid, p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.habitus_is_group_lead(p_group_id) THEN
    DELETE FROM public.habitus_group_members
    WHERE group_id = p_group_id AND profile_id = p_profile_id AND is_confirmed = false;
    RETURN NULL;
  END IF;

  IF auth.uid() = p_profile_id THEN
    DELETE FROM public.habitus_group_members
    WHERE group_id = p_group_id AND profile_id = p_profile_id AND is_confirmed = false;
    RETURN NULL;
  END IF;

  RETURN 'No autorizado';
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_reject_group_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_reject_group_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_public_group_preview(p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_row public.habitus_groups%ROWTYPE;
  v_confirmed integer;
BEGIN
  SELECT * INTO v_row FROM public.habitus_groups WHERE slug = p_slug;

  IF v_row.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_row.status NOT IN ('forming', 'ready', 'active') THEN
    RETURN NULL;
  END IF;

  v_confirmed := public.habitus_group_confirmed_count(v_row.id);

  RETURN json_build_object(
    'slug', v_row.slug,
    'name', v_row.name,
    'city', v_row.city,
    'status', v_row.status,
    'targetMembers', v_row.target_members,
    'confirmedCount', v_confirmed,
    'spotsLeft', GREATEST(v_row.target_members - v_confirmed, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_public_group_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_public_group_preview(text) TO anon, authenticated;

-- RLS adicional: lead puede actualizar/eliminar miembros pendientes
DROP POLICY IF EXISTS habitus_group_members_update ON public.habitus_group_members;
CREATE POLICY habitus_group_members_update ON public.habitus_group_members
  FOR UPDATE TO authenticated
  USING (
    public.habitus_is_group_lead(group_id)
    OR (profile_id = auth.uid() AND is_confirmed = false)
  )
  WITH CHECK (
    public.habitus_is_group_lead(group_id)
    OR (profile_id = auth.uid() AND is_confirmed = false)
  );

DROP POLICY IF EXISTS habitus_group_members_delete ON public.habitus_group_members;
CREATE POLICY habitus_group_members_delete ON public.habitus_group_members
  FOR DELETE TO authenticated
  USING (
    public.habitus_is_group_lead(group_id)
    OR (profile_id = auth.uid() AND is_confirmed = false)
  );
