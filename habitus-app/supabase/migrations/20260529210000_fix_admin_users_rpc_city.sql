-- Fix habitus_admin_get_users_with_email() referencing a non-existent column.
--
-- Bug: the function SELECTed p.city, but habitus_profiles has no city column
-- (none exists). Every call raised `42703: column p.city does not exist`,
-- returning HTTP 400 from PostgREST. This broke THREE admin pages that depend
-- on this RPC: /admin/usuarios, /admin/embajadores and /admin/matching
-- (all rendered "No se pudieron cargar los datos.").
--
-- A second latent mismatch was masked behind the city error: profile_score is
-- a smallint column but the function declares it integer (column 9), raising
-- `42804: structure of query does not match function result type`. Both are
-- fixed here: NULL::text for the missing city, and profile_score::integer.

CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email()
 RETURNS TABLE(id uuid, email text, display_name text, account_role text, admin_role text, is_admin boolean, is_discoverable boolean, identity_status text, profile_score integer, suspended_at timestamp with time zone, deleted_at timestamp with time zone, city text, onboarding_completed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.habitus_is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT p.id, u.email::text, p.display_name, p.account_role::text,
           p.admin_role, p.is_admin, p.is_discoverable, p.identity_status,
           p.profile_score::integer, p.suspended_at, p.deleted_at,
           NULL::text AS city, p.onboarding_completed_at, u.created_at
    FROM public.habitus_profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY u.created_at DESC LIMIT 500;
END; $function$;
