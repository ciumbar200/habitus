-- Create a view in the public schema to access auth.users data
-- This is the proper Supabase pattern for accessing user emails from RPC functions

-- Create or replace view that exposes only the necessary fields from auth.users
CREATE OR REPLACE VIEW public.auth_users_view AS
SELECT
  id::uuid,
  email::text,
  created_at::timestamp with time zone,
  updated_at::timestamp with time zone,
  raw_user_meta_data::jsonb,
  raw_app_meta_data::jsonb
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON public.auth_users_view TO authenticated;
GRANT SELECT ON public.auth_users_view TO service_role;

-- Now update the RPC function to use this view instead of directly accessing auth.users
CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email(p_limit integer DEFAULT 500)
 RETURNS TABLE(id uuid, email text, display_name text, account_role text, is_discoverable boolean, identity_status text, profile_score integer, suspended_at timestamp with time zone, deleted_at timestamp with time zone, onboarding_completed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE v_limit integer;
BEGIN
  -- Check authorization first
  IF NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Validate and enforce limit bounds (1-500)
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 500);

  -- Return query using the view instead of direct auth.users access
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
    JOIN public.auth_users_view u ON u.id = p.id
    ORDER BY u.created_at DESC
    LIMIT v_limit;
END; $function$;

-- Grant execute permission
REVOKE ALL ON FUNCTION public.habitus_admin_get_users_with_email(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO service_role;
