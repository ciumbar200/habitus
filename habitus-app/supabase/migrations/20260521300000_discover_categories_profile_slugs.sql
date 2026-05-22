-- Categorías Descubrir: Todos / Habitación / Piso (eliminar suites, lofts, etc.)
-- Perfiles: slug público + lectura de perfiles discoverables y anfitriones

-- 1) Reasignar listados con categorías antiguas
UPDATE public.habitus_listings l
SET category_id = (
  SELECT id FROM public.habitus_categories WHERE slug = 'piso-grupo' LIMIT 1
)
WHERE category_id IN (
  SELECT id FROM public.habitus_categories
  WHERE slug IN ('shared-suites', 'studio-lofts', 'creative-hubs', 'quiet-residences', 'all')
);

UPDATE public.habitus_listings l
SET category_id = (
  SELECT id FROM public.habitus_categories WHERE slug = 'habitacion' LIMIT 1
)
WHERE category_id IS NULL
  AND l.slug IN ('habitacion-eixample-demo', 'habitacion-malasana-demo');

DELETE FROM public.habitus_categories
WHERE slug IN ('shared-suites', 'studio-lofts', 'creative-hubs', 'quiet-residences', 'all');

INSERT INTO public.habitus_categories (slug, label, sort_order) VALUES
  ('habitacion', 'Habitación', 1),
  ('piso-grupo', 'Piso', 2)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- 2) Slug público en perfiles
ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS habitus_profiles_slug_uq
  ON public.habitus_profiles (slug)
  WHERE slug IS NOT NULL AND slug <> '';

UPDATE public.habitus_profiles p
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(coalesce(display_name, 'usuario')), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
) || '-' || substr(replace(p.id::text, '-', ''), 1, 6)
WHERE slug IS NULL OR trim(slug) = '';

-- 3) RLS: ver perfiles discoverables, anfitriones y el propio
DROP POLICY IF EXISTS habitus_profiles_discoverable_read ON public.habitus_profiles;
CREATE POLICY habitus_profiles_discoverable_read ON public.habitus_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_discoverable = true
    OR account_role IN ('anfitrion', 'propietario', 'agencia')
    OR public.habitus_is_admin()
  );

-- Tags de perfil visibles si el perfil es legible
DROP POLICY IF EXISTS habitus_profile_tags_read ON public.habitus_profile_tags;
CREATE POLICY habitus_profile_tags_read ON public.habitus_profile_tags
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habitus_profiles p
      WHERE p.id = habitus_profile_tags.profile_id
        AND (
          p.id = auth.uid()
          OR p.is_discoverable = true
          OR p.account_role IN ('anfitrion', 'propietario', 'agencia')
          OR public.habitus_is_admin()
        )
    )
  );
