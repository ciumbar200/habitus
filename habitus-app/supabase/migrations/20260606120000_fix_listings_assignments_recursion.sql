-- Fix: "infinite recursion detected in policy for relation habitus_listings".
--
-- Causa: tras re-habilitar RLS + el sistema de asignaciones, las políticas
-- quedaron con referencias cruzadas mutuas entre tablas con RLS activa:
--   habitus_listings_read  -> EXISTS(habitus_listing_assignments)
--   habitus_assignments_read -> EXISTS(habitus_listings)
-- Evaluar una dispara la RLS de la otra y vuelve a la primera => recursión => HTTP 500.
--
-- Solución: encapsular cada lookup cruzado en una función SECURITY DEFINER
-- (salta RLS, por lo que no puede reentrar en la política de la otra tabla).

-- ¿El usuario actual es anfitrión asignado a este listing?
CREATE OR REPLACE FUNCTION public.habitus_is_listing_assigned_host(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_listing_assignments a
    WHERE a.listing_id = p_listing_id
      AND a.host_profile_id = auth.uid()
  );
$function$;

-- ¿El usuario actual es propietario de este listing?
CREATE OR REPLACE FUNCTION public.habitus_owns_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_listings l
    WHERE l.id = p_listing_id
      AND l.owner_profile_id = auth.uid()
  );
$function$;

GRANT EXECUTE ON FUNCTION public.habitus_is_listing_assigned_host(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_owns_listing(uuid) TO anon, authenticated;

-- Recrear políticas usando las funciones (mismo significado, sin recursión).

DROP POLICY IF EXISTS habitus_listings_read ON public.habitus_listings;
CREATE POLICY habitus_listings_read ON public.habitus_listings
  FOR SELECT
  USING (
    (status = 'published'::habitus_listing_status AND visibility = 'public')
    OR owner_profile_id = auth.uid()
    OR host_profile_id = auth.uid()
    OR public.habitus_is_listing_assigned_host(id)
  );

DROP POLICY IF EXISTS habitus_listings_update ON public.habitus_listings;
CREATE POLICY habitus_listings_update ON public.habitus_listings
  FOR UPDATE
  USING (
    owner_profile_id = auth.uid()
    OR host_profile_id = auth.uid()
    OR public.habitus_is_listing_assigned_host(id)
  );

DROP POLICY IF EXISTS habitus_assignments_read ON public.habitus_listing_assignments;
CREATE POLICY habitus_assignments_read ON public.habitus_listing_assignments
  FOR SELECT
  USING (
    host_profile_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.habitus_is_admin()
    OR public.habitus_owns_listing(listing_id)
  );
