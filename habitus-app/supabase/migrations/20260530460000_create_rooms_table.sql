-- Create rooms table for individual room management within listings
-- Allows one listing (apartment) to have multiple rooms, each with assigned host

CREATE TABLE IF NOT EXISTS public.habitus_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Habitación 1", "Room A", "Doble con baño"
  room_type text NOT NULL, -- individual, double, suite, etc.
  price_monthly numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for finding rooms in a listing
CREATE INDEX IF NOT EXISTS habitus_rooms_listing_idx
  ON public.habitus_rooms (listing_id)
  WHERE is_active = true;

-- Index for active rooms
CREATE INDEX IF NOT EXISTS habitus_rooms_active_idx
  ON public.habitus_rooms (is_active)
  WHERE is_active = true;

COMMENT ON TABLE public.habitus_rooms IS
  'Habitaciones individuales dentro de un listing (piso).';

COMMENT ON COLUMN public.habitus_rooms.listing_id IS
  'El listing (piso) al que pertenece esta habitación.';

COMMENT ON COLUMN public.habitus_rooms.name IS
  'Nombre descriptivo de la habitación.';

COMMENT ON COLUMN public.habitus_rooms.room_type IS
  'Tipo de habitación: individual, double, suite, studio, etc.';

-- Enable RLS
ALTER TABLE public.habitus_rooms ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS habitus_rooms_admin_all ON public.habitus_rooms;
CREATE POLICY habitus_rooms_admin_all ON public.habitus_rooms
  FOR ALL
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Listing owner can manage their rooms
DROP POLICY IF EXISTS habitus_rooms_owner_manage ON public.habitus_rooms;
CREATE POLICY habitus_rooms_owner_manage ON public.habitus_rooms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.habitus_listings l
      WHERE l.id = habitus_rooms.listing_id
        AND l.owner_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habitus_listings l
      WHERE l.id = habitus_rooms.listing_id
        AND l.owner_profile_id = auth.uid()
    )
  );

-- Everyone can read active rooms
DROP POLICY IF EXISTS habitus_rooms_public_read ON public.habitus_rooms;
CREATE POLICY habitus_rooms_public_read ON public.habitus_rooms
  FOR SELECT
  USING (is_active = true);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.habitus_update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS habitus_rooms_updated_at ON public.habitus_rooms;
CREATE TRIGGER habitus_rooms_updated_at
  BEFORE UPDATE ON public.habitus_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.habitus_update_rooms_updated_at();
