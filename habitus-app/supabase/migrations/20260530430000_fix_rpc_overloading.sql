-- Fix: Remove all overloaded versions of the admin RPC and create a single version
-- PostgreSQL function overloading was causing "could not choose best candidate" errors

-- Drop ALL versions of the function (with different signatures)
DROP FUNCTION IF EXISTS public.habitus_admin_get_users_with_email() CASCADE;
DROP FUNCTION IF EXISTS public.habitus_admin_get_users_with_email(integer) CASCADE;

-- Create a single version with default parameter
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
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.email, '') as email,
    COALESCE(p.display_name, '') as display_name,
    COALESCE(p.account_role::text, '') as account_role,
    COALESCE(p.is_admin, false) as is_admin,
    COALESCE(p.is_discoverable, false) as is_discoverable,
    COALESCE(p.identity_status::text, 'none') as identity_status,
    COALESCE(p.profile_score, 0) as profile_score,
    p.suspended_at,
    p.deleted_at,
    p.onboarding_completed_at,
    p.created_at
  FROM public.habitus_profiles p
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 500), 1), 500);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO service_role;

-- Verify only one version exists
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname = 'habitus_admin_get_users_with_email'
    AND pronamespace = 'public'::regnamespace;

  RAISE NOTICE 'Function versions found: % (should be 1)', v_count;

  IF v_count > 1 THEN
    RAISE EXCEPTION 'Still multiple function versions found!';
  END IF;

  -- Test the function
  PERFORM public.habitus_admin_get_users_with_email();
  RAISE NOTICE 'Function test successful';
END $$;
