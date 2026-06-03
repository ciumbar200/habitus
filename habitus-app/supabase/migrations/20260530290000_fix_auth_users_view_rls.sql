-- Fix auth_users_view permissions and RLS
-- The view needs to be accessible by authenticated users

-- First, let's verify the view exists and grant proper permissions
DO $$
BEGIN
  -- Revoke any existing permissions to start clean
  REVOKE ALL ON public.auth_users_view FROM PUBLIC;
  REVOKE ALL ON public.auth_users_view FROM authenticated;
  REVOKE ALL ON public.auth_users_view FROM service_role;

  -- Grant select permissions
  GRANT SELECT ON public.auth_users_view TO authenticated;
  GRANT SELECT ON public.auth_users_view TO service_role;
  GRANT SELECT ON public.auth_users_view TO anon;
EXCEPTION
  WHEN undefined_object THEN
    -- View doesn't exist, create it
    CREATE OR REPLACE VIEW public.auth_users_view AS
    SELECT
      id::uuid,
      email::text,
      created_at::timestamp with time zone,
      updated_at::timestamp with time zone
    FROM auth.users;

    GRANT SELECT ON public.auth_users_view TO authenticated;
    GRANT SELECT ON public.auth_users_view TO service_role;
    GRANT SELECT ON public.auth_users_view TO anon;
END $$;

-- Now update the RPC function with better error handling
CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email(p_limit integer DEFAULT 500)
 RETURNS TABLE(id uuid, email text, display_name text, account_role text, is_discoverable boolean, identity_status text, profile_score integer, suspended_at timestamp with time zone, deleted_at timestamp with time zone, onboarding_completed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE v_limit integer;
  v_is_admin boolean;
  v_current_id uuid;
BEGIN
  -- Get current user ID
  v_current_id := auth.uid();

  -- Check authorization first with explicit query
  SELECT is_admin INTO v_is_admin
  FROM public.habitus_profiles
  WHERE id = v_current_id;

  IF v_is_admin IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'No autorizado: is_admin=% for user=%', v_is_admin, v_current_id USING ERRCODE = '42501';
  END IF;

  -- Validate and enforce limit bounds (1-500)
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 500);

  -- Return query using the view
  RETURN QUERY
    SELECT
      p.id::uuid,
      u.email::text,
      p.display_name::text,
      p.account_role::text,
      (p.is_discoverable IS NOT NULL AND p.is_discoverable)::boolean,
      COALESCE(p.identity_status::text, 'none')::text,
      COALESCE(p.profile_score::integer, 0)::integer,
      p.suspended_at,
      p.deleted_at,
      p.onboarding_completed_at,
      u.created_at
    FROM public.habitus_profiles p
    LEFT JOIN public.auth_users_view u ON u.id = p.id
    ORDER BY p.created_at DESC
    LIMIT v_limit;
END; $function$;

-- Grant execute permission
REVOKE ALL ON FUNCTION public.habitus_admin_get_users_with_email(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO service_role;
