-- Check the actual user data for the demo admin user
-- This will help identify why the RPC is failing

-- Get all admin users (is_admin = true)
SELECT
  u.id::text,
  u.email,
  p.display_name,
  p.account_role,
  p.is_admin,
  p.email as profile_email,
  p.is_discoverable,
  p.identity_status,
  p.profile_score
FROM auth.users u
LEFT JOIN public.habitus_profiles p ON p.id = u.id
WHERE p.is_admin = true OR u.email LIKE '%admin%';

-- Also check if the email sync worked
SELECT
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as with_email,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') as without_email,
  COUNT(*) as total_profiles
FROM public.habitus_profiles;

-- Update the RPC function to be even simpler - just return the first 10 users
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
  SELECT
    p.id,
    p.email,
    p.display_name,
    p.account_role::text,
    p.is_discoverable,
    p.identity_status::text,
    p.profile_score,
    p.suspended_at,
    p.deleted_at,
    p.onboarding_completed_at,
    p.created_at
  FROM public.habitus_profiles p
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email(integer) TO service_role;
