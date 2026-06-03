-- Fix auth.users access for admin RPC functions
-- The habitus_admin_get_users_with_email function needs to read user emails
-- but auth.users is in a protected schema. We need to grant access.

-- Grant access to necessary columns in auth.users for authenticated users
-- This allows the admin RPC function to read emails
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT (id, email) ON auth.users TO authenticated;

-- Alternatively, we could modify the RPC function to not JOIN with auth.users
-- and instead rely on a separate view, but the grant approach is simpler
