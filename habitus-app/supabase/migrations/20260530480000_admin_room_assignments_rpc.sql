-- RPC functions for admin room assignment management

-- Get all rooms with their assignments for admin
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
  RETURN QUERY
  SELECT
    r.id as room_id,
    r.name as room_name,
    r.room_type as room_type,
    r.price_monthly as price_monthly,
    r.listing_id as listing_id,
    l.name as listing_name,
    l.city as listing_city,
    l.owner_profile_id as owner_id,
    p_owner.display_name as owner_name,
    p_owner.email as owner_email,
    a.host_profile_id as host_id,
    p_host.display_name as host_name,
    p_host.email as host_email,
    a.assigned_at as assigned_at,
    p_assigned_by.display_name as assigned_by_name,
    a.is_active as is_active
  FROM public.habitus_rooms r
  JOIN public.habitus_listings l ON l.id = r.listing_id
  JOIN public.profiles p_owner ON p_owner.id = l.owner_profile_id
  LEFT JOIN public.habitus_room_assignments a ON a.room_id = r.id AND a.is_active = true
  LEFT JOIN public.profiles p_host ON p_host.id = a.host_profile_id
  LEFT JOIN public.profiles p_assigned_by ON p_assigned_by.id = a.assigned_by
  WHERE r.is_active = true
  ORDER BY l.city, l.name, r.name;
END;
$$;

-- Grant access to authenticated users (admin check is inside)
GRANT EXECUTE ON FUNCTION public.admin_get_rooms_with_assignments() TO authenticated;

-- Assign or update a host for a room
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
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Se requiere permisos de administrador'
    );
  END IF;

  -- Get room info
  SELECT r.id, r.listing_id, l.owner_profile_id
  INTO v_room_id, v_listing_id, v_owner_id
  FROM public.habitus_rooms r
  JOIN public.habitus_listings l ON l.id = r.listing_id
  WHERE r.id = p_room_id AND r.is_active = true;

  IF v_room_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Habitación no encontrada'
    );
  END IF;

  -- Verify host exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_host_profile_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil de anfitrión no encontrado'
    );
  END IF;

  -- Deactivate existing assignment if any
  UPDATE public.habitus_room_assignments
  SET is_active = false
  WHERE room_id = p_room_id AND is_active = true;

  -- Create new assignment
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

GRANT EXECUTE ON FUNCTION public.admin_assign_room_host(uuid, uuid) TO authenticated;

-- Remove room assignment
CREATE OR REPLACE FUNCTION public.admin_remove_room_host(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Se requiere permisos de administrador'
    );
  END IF;

  UPDATE public.habitus_room_assignments
  SET is_active = false
  WHERE room_id = p_room_id AND is_active = true;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No hay asignación activa para esta habitación'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_remove_room_host(uuid) TO authenticated;

-- Create a new room for a listing
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
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Se requiere permisos de administrador'
    );
  END IF;

  -- Verify listing exists
  IF NOT EXISTS (SELECT 1 FROM public.habitus_listings WHERE id = p_listing_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Listing no encontrado'
    );
  END IF;

  -- Create room
  INSERT INTO public.habitus_rooms (listing_id, name, room_type, price_monthly)
  VALUES (p_listing_id, p_name, p_room_type, p_price_monthly)
  RETURNING id INTO v_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room_id,
    'listing_id', p_listing_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_room(uuid, text, text, numeric) TO authenticated;

-- Update room details
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
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Se requiere permisos de administrador'
    );
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
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Habitación no encontrada'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_room(uuid, text, text, numeric, boolean) TO authenticated;
