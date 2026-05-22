-- Condiciones del alquiler y verificación de propiedad por anuncio

ALTER TABLE public.habitus_listings
  ADD COLUMN IF NOT EXISTS listing_conditions text;

ALTER TABLE public.habitus_listings
  ADD COLUMN IF NOT EXISTS property_verification_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.habitus_listings
  DROP CONSTRAINT IF EXISTS habitus_listings_property_verification_status_check;

ALTER TABLE public.habitus_listings
  ADD CONSTRAINT habitus_listings_property_verification_status_check
  CHECK (property_verification_status IN ('none', 'pending', 'verified'));

ALTER TABLE public.habitus_listings
  ADD COLUMN IF NOT EXISTS property_verified_at timestamptz;

COMMENT ON COLUMN public.habitus_listings.listing_conditions IS
  'Condiciones del alquiler: duración mínima, fianza, gastos, normas…';

COMMENT ON COLUMN public.habitus_listings.property_verification_status IS
  'Verificación del inmueble: none, pending, verified (demo KYC inmueble)';
