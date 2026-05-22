-- Grupos de convivencia, verificación de identidad (mock) y espacios privados/públicos

-- Identidad en perfil
ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'none'
    CHECK (identity_status IN ('none', 'pending', 'verified'));

ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

COMMENT ON COLUMN public.habitus_profiles.identity_status IS
  'Estado KYC: none, pending (Veriff mock), verified';

-- Visibilidad del espacio
ALTER TABLE public.habitus_listings
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private'));

COMMENT ON COLUMN public.habitus_listings.visibility IS
  'public = descubrible; private = solo propietario, anfitrión y perfiles/grupos desbloqueados';

-- Grupos para alquilar juntos
CREATE TABLE IF NOT EXISTS public.habitus_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.habitus_listings(id) ON DELETE SET NULL,
  city text,
  status text NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming', 'ready', 'active', 'archived')),
  target_members int NOT NULL DEFAULT 3,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitus_group_members (
  group_id uuid NOT NULL REFERENCES public.habitus_groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  room_label text,
  share_amount numeric(10,2),
  is_confirmed boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, profile_id)
);

-- Desbloqueo de espacios privados (grupo o persona)
CREATE TABLE IF NOT EXISTS public.habitus_listing_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.habitus_groups(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT habitus_listing_access_target CHECK (
    group_id IS NOT NULL OR profile_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS habitus_listing_access_group_uq
  ON public.habitus_listing_access (listing_id, group_id)
  WHERE group_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS habitus_listing_access_profile_uq
  ON public.habitus_listing_access (listing_id, profile_id)
  WHERE profile_id IS NOT NULL;

ALTER TABLE public.habitus_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_listing_access ENABLE ROW LEVEL SECURITY;

-- Grupos: miembros ven su grupo; cualquier autenticado puede crear
DROP POLICY IF EXISTS habitus_groups_read ON public.habitus_groups;
CREATE POLICY habitus_groups_read ON public.habitus_groups
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_group_members gm
      WHERE gm.group_id = habitus_groups.id AND gm.profile_id = auth.uid()
    )
    OR public.habitus_is_admin()
  );

DROP POLICY IF EXISTS habitus_groups_insert ON public.habitus_groups;
CREATE POLICY habitus_groups_insert ON public.habitus_groups
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS habitus_groups_update ON public.habitus_groups;
CREATE POLICY habitus_groups_update ON public.habitus_groups
  FOR UPDATE TO authenticated
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_group_members gm
      WHERE gm.group_id = habitus_groups.id AND gm.profile_id = auth.uid() AND gm.role = 'lead'
    )
  );

DROP POLICY IF EXISTS habitus_group_members_read ON public.habitus_group_members;
CREATE POLICY habitus_group_members_read ON public.habitus_group_members
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_group_members gm2
      WHERE gm2.group_id = habitus_group_members.group_id AND gm2.profile_id = auth.uid()
    )
    OR public.habitus_is_admin()
  );

DROP POLICY IF EXISTS habitus_group_members_insert ON public.habitus_group_members;
CREATE POLICY habitus_group_members_insert ON public.habitus_group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_groups g
      WHERE g.id = group_id AND g.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS habitus_listing_access_read ON public.habitus_listing_access;
CREATE POLICY habitus_listing_access_read ON public.habitus_listing_access
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR granted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.habitus_group_members gm
      WHERE gm.group_id = habitus_listing_access.group_id AND gm.profile_id = auth.uid()
    )
    OR public.habitus_is_admin()
  );

DROP POLICY IF EXISTS habitus_listing_access_insert ON public.habitus_listing_access;
CREATE POLICY habitus_listing_access_insert ON public.habitus_listing_access
  FOR INSERT TO authenticated
  WITH CHECK (
    granted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habitus_listings l
      WHERE l.id = listing_id AND l.owner_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS habitus_listing_access_delete ON public.habitus_listing_access;
CREATE POLICY habitus_listing_access_delete ON public.habitus_listing_access
  FOR DELETE TO authenticated
  USING (granted_by = auth.uid() OR public.habitus_is_admin());

-- Listings: incluir privados si hay acceso
DROP POLICY IF EXISTS habitus_listings_private_access ON public.habitus_listings;
CREATE POLICY habitus_listings_private_access ON public.habitus_listings
  FOR SELECT TO authenticated
  USING (
    visibility = 'private'
    AND (
      owner_profile_id = auth.uid()
      OR host_profile_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.habitus_listing_access a
        WHERE a.listing_id = habitus_listings.id
          AND (
            a.profile_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.habitus_group_members gm
              WHERE gm.group_id = a.group_id AND gm.profile_id = auth.uid()
            )
          )
      )
    )
  );

-- Perfil: actualizar identity_status propio
DROP POLICY IF EXISTS habitus_profiles_identity_update ON public.habitus_profiles;
CREATE POLICY habitus_profiles_identity_update ON public.habitus_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
