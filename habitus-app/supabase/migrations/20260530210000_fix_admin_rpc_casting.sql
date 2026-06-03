-- Fix type casting in habitus_admin_get_users_with_email
--
-- The previous fix removed the city column but didn't add proper casting
-- for all columns, causing potential type mismatches in the RETURNS clause.

CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email(p_limit integer DEFAULT 500)
 RETURNS TABLE(id uuid, email text, display_name text, account_role text, is_discoverable boolean, identity_status text, profile_score integer, suspended_at timestamp with time zone, deleted_at timestamp with time zone, onboarding_completed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_limit integer;
BEGIN
  IF NOT public.habitus_is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  -- Validate and enforce limit bounds (1-500)
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 500);
  RETURN QUERY
    SELECT p.id, u.email::text, p.display_name, p.account_role::text,
           p.is_discoverable::boolean, p.identity_status::text,
           p.profile_score::integer, p.suspended_at, p.deleted_at,
           p.onboarding_completed_at, u.created_at
    FROM public.habitus_profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY u.created_at DESC LIMIT v_limit;
END; $function$;
