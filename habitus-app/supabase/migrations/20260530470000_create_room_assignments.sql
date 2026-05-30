-- Create room_assignments table for host assignment at room level
-- Replaces listing_assignments for more granular control

CREATE TABLE IF NOT EXISTS public.habitus_room_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.habitus_rooms(id) ON DELETE CASCADE,
  host_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.habitus_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (room_id) -- One host per room
);

-- Index for finding rooms by host
CREATE INDEX IF NOT EXISTS habitus_room_assignments_host_idx
  ON public.habitus_room_assignments (host_profile_id)
  WHERE is_active = true;

-- Index for finding assignments in a listing
CREATE INDEX IF NOT EXISTS habitus_room_assignments_listing_idx
  ON public.habitus_room_assignments (room_id)
  WHERE is_active = true;

COMMENT ON TABLE public.habitus_room_assignments IS
  'Anfitrión asignado por admin a una habitación específica.';

COMMENT ON COLUMN public.habitus_room_assignments.room_id IS
  'La habitación a la que se asigna el anfitrión.';

COMMENT ON COLUMN public.habitus_room_assignments.host_profile_id IS
  'El perfil del anfitrión asignado.';

COMMENT ON COLUMN public.habitus_room_assignments.assigned_by IS
  'Admin que hizo la asignación.';

-- Enable RLS
ALTER TABLE public.habitus_room_assignments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS habitus_room_assignments_admin_all ON public.habitus_room_assignments;
CREATE POLICY habitus_room_assignments_admin_all ON public.habitus_room_assignments
  FOR ALL
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Host can read their own assignments
DROP POLICY IF EXISTS habitus_room_assignments_host_read ON public.habitus_room_assignments;
CREATE POLICY habitus_room_assignments_host_read ON public.habitus_room_assignments
  FOR SELECT
  USING (host_profile_id = auth.uid());

-- Listing owner can read assignments for their rooms
DROP POLICY IF EXISTS habitus_room_assignments_owner_read ON public.habitus_room_assignments;
CREATE POLICY habitus_room_assignments_owner_read ON public.habitus_room_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habitus_rooms r
      JOIN public.habitus_listings l ON l.id = r.listing_id
      WHERE r.id = habitus_room_assignments.room_id
        AND l.owner_profile_id = auth.uid()
    )
  );
