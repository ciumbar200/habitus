-- Comprehensive fix for admin RPC function
-- This addresses: email sync, parameter handling, return types, and RLS bypass

-- Step 1: Ensure all profiles have email synced
DO $$
DECLARE
  v_sync_count integer;
BEGIN
  -- Sync emails from auth.users to habitus_profiles
  UPDATE public.habitus_profiles p
  SET email = u.email::text
  FROM auth.users u
  WHERE u.id = p.id
    AND (p.email IS NULL OR p.email = '' OR p.email IS DISTINCT FROM u.email::text);

  GET DIAGNOSTICS v_sync_count = ROW_COUNT;
  RAISE NOTICE 'Synced emails for % profiles', v_sync_count;
END $$;

-- Step 2: Verify demo admin user has correct setup
DO $$
DECLARE
  v_admin_id uuid;
  v_has_admin boolean;
BEGIN
  -- Get demo admin user ID
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'demo-admin@e2e.habitus.local';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Demo admin user not found';
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT is_admin INTO v_has_admin
  FROM public.habitus_profiles
  WHERE id = v_admin_id;

  IF v_has_admin IS DISTINCT FROM true THEN
    UPDATE public.habitus_profiles
    SET is_admin = true
    WHERE id = v_admin_id;
    RAISE NOTICE 'Set is_admin=true for demo admin';
  END IF;
END $$;

-- Step 3: Create RPC function with proper parameter handling
DROP FUNCTION IF EXISTS public.habitus_admin_get_users_with_email(integer);

CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email(p_limit integer DEFAULT 500)
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  account_role text,
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
  -- Use COALESCE for all nullable fields to ensure consistent JSON output
  SELECT
    p.id,
    COALESCE(p.email, '') as email,
    COALESCE(p.display_name, '') as display_name,
    COALESCE(p.account_role::text, '') as account_role,
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

-- Step 4: Verify data exists
DO $$
DECLARE
  v_profile_count integer;
  v_email_count integer;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM public.habitus_profiles;
  SELECT COUNT(*) INTO v_email_count FROM public.habitus_profiles WHERE email IS NOT NULL AND email != '';

  RAISE NOTICE 'Profiles: %, with email: %', v_profile_count, v_email_count;

  IF v_profile_count = 0 THEN
    RAISE EXCEPTION 'No profiles found in database';
  END IF;
END $$;
