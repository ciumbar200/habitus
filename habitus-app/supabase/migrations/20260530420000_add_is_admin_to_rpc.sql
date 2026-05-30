-- Fix: Add is_admin column to admin RPC function
-- The admin pages expect is_admin to be returned by the RPC but it was missing
-- This migration updates the RPC to include is_admin from habitus_profiles

-- Recreate the function with is_admin column included
DROP FUNCTION IF EXISTS public.habitus_admin_get_users_with_email(integer);

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

-- Verify the function returns data with is_admin
DO $$
DECLARE
  v_result record;
  v_count integer;
BEGIN
  -- Count total profiles
  SELECT COUNT(*) INTO v_count FROM public.habitus_profiles;
  RAISE NOTICE 'Total profiles: %', v_count;

  -- Check if any admin users exist
  SELECT COUNT(*) INTO v_count
  FROM public.habitus_profiles
  WHERE is_admin = true;
  RAISE NOTICE 'Admin profiles: %', v_count;

  -- Test the function and verify is_admin is returned
  FOR v_result IN
    SELECT * FROM public.habitus_admin_get_users_with_email(1)
  LOOP
    RAISE NOTICE 'Test result: id=%, email=%, is_admin=%', v_result.id, v_result.email, v_result.is_admin;
    RETURN;
  END LOOP;
END $$;
