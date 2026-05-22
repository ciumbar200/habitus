-- Eliminar anuncios (propietario/anfitrión) y cuenta propia (App Store)

DROP POLICY IF EXISTS habitus_listings_delete ON public.habitus_listings;
CREATE POLICY habitus_listings_delete ON public.habitus_listings
  FOR DELETE TO authenticated
  USING (owner_profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.habitus_delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Anuncios donde es propietario del listing
  DELETE FROM public.habitus_listings WHERE owner_profile_id = uid;

  -- Si era anfitrión asignado en piso ajeno, desvincular sin borrar el piso
  UPDATE public.habitus_listings
  SET host_profile_id = NULL, updated_at = now()
  WHERE host_profile_id = uid AND owner_profile_id <> uid;

  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_delete_own_account() TO authenticated;
