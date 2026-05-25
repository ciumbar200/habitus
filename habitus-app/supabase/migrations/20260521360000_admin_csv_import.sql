-- Admin CSV import: resolver emails y permitir insert de espacios

CREATE OR REPLACE FUNCTION public.habitus_admin_profile_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN (
    SELECT u.id
    FROM auth.users u
    WHERE lower(u.email) = lower(trim(p_email))
    LIMIT 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_admin_profile_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_profile_id_by_email(text) TO authenticated;

DROP POLICY IF EXISTS habitus_listings_admin_insert ON public.habitus_listings;
CREATE POLICY habitus_listings_admin_insert ON public.habitus_listings
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_is_admin());
