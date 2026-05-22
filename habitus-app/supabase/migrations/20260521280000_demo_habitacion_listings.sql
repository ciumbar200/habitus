-- Demo: categorías habitación vs piso para grupos + 2 habitaciones públicas con anfitrión

INSERT INTO public.habitus_categories (slug, label, sort_order) VALUES
  ('habitacion', 'Habitación', 1),
  ('piso-grupo', 'Piso para grupos', 2)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- Cuestionario del anfitrión demo (para score de compatibilidad en habitaciones)
UPDATE public.habitus_profiles p
SET compat_quiz = '{
  "schedule": "balanced",
  "cleanliness": "tidy",
  "social": "moderate",
  "pets": "depends",
  "remote": "hybrid",
  "hosting_style": "flexible",
  "visits": "sometimes"
}'::jsonb
FROM auth.users u
WHERE p.id = u.id AND u.email = 'demo-anfitrion@e2e.habitus.local';

INSERT INTO public.habitus_listings (
  slug,
  name,
  location,
  city,
  price_monthly,
  currency,
  compatibility_score,
  cover_image_url,
  category_id,
  available_from,
  room_type,
  description,
  owner_profile_id,
  host_profile_id,
  status,
  visibility
)
SELECT
  v.slug,
  v.name,
  v.location,
  v.city,
  v.price_monthly,
  v.currency,
  v.compatibility_score,
  v.cover_image_url,
  (SELECT id FROM public.habitus_categories WHERE slug = 'habitacion'),
  v.available_from::date,
  v.room_type,
  v.description,
  (SELECT p.id FROM public.habitus_profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'demo-propietario@e2e.habitus.local'),
  (SELECT p.id FROM public.habitus_profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'demo-anfitrion@e2e.habitus.local'),
  'published'::public.habitus_listing_status,
  'public'
FROM (VALUES
  (
    'habitacion-eixample-demo',
    'Habitación luminosa en Eixample',
    'Eixample, Barcelona',
    'Barcelona',
    720,
    'EUR',
    88,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCxNC4fnqYI-WPPJ6kja6257E7AUVlNv4PWbycUCIwncJrgc6RB4cRkGUgLsz00F44UOvU11FIDVBLkk-DPXpX3faAwJRNSx31ALu-bhjiXCiOB05A1mpfDpcXVoS8WAHG18cdHhiF66_VhAMQ70iy7lIP6L7cAEW19lHUmp-1ks2qWIMbknxmSblREyFi37FhO9jaZEs4kKokoSOD7D_eTeVWgAZlEWPaxHHtt-j7DSFssrWsUzo9Znypi6MYiN3TPdO_ieyDUhWA',
    '2026-06-01',
    'Habitación individual',
    'Habitación exterior en piso compartido de 4 habitaciones. Cocina equipada, salón amplio y anfitrión residente que cuida la convivencia.'
  ),
  (
    'habitacion-malasana-demo',
    'Habitación en piso compartido — Malasaña',
    'Malasaña, Madrid',
    'Madrid',
    680,
    'EUR',
    85,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCZAEKjQ7xsaxov_2snvIH8toKuGx1XXg1OpaKW4PixWHATZYcrox-9vbEvHsk6c9Y6Y5d-qJTiNiRtIWaZcdKM5_55FttDdzekDE-4NG-Hu9UJGE59VSPoXdzKA-uvnLqIj7Xfh2qWl_46Jv1e8u0yuklNd1wSMnYhmZrSoVjMGlSa7P8YEpjiI1lDqgbOglVxMMzYJn3a7pxSvCDq9jmG2QoNJqARyUBobMXDowoo-zXYkDCO3s7k1kxv7SL-ClnnEU9FRhaxVtQ',
    '2026-07-01',
    'Habitación doble',
    'Ideal para quien busca barrio con vida cultural y compañeros tranquilos. Baño compartido, calefacción central y terraza pequeña.'
  )
) AS v(slug, name, location, city, price_monthly, currency, compatibility_score, cover_image_url, available_from, room_type, description)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  city = EXCLUDED.city,
  price_monthly = EXCLUDED.price_monthly,
  currency = EXCLUDED.currency,
  compatibility_score = EXCLUDED.compatibility_score,
  cover_image_url = EXCLUDED.cover_image_url,
  category_id = EXCLUDED.category_id,
  available_from = EXCLUDED.available_from,
  room_type = EXCLUDED.room_type,
  description = EXCLUDED.description,
  owner_profile_id = EXCLUDED.owner_profile_id,
  host_profile_id = EXCLUDED.host_profile_id,
  status = EXCLUDED.status,
  visibility = EXCLUDED.visibility,
  updated_at = now();

INSERT INTO public.habitus_listing_amenities (listing_id, icon, label, sort_order)
SELECT l.id, a.icon, a.label, a.ord
FROM public.habitus_listings l
JOIN (VALUES
  ('habitacion-eixample-demo', 'wifi', 'Wi‑Fi fibra', 0),
  ('habitacion-eixample-demo', 'kitchen', 'Cocina compartida', 1),
  ('habitacion-eixample-demo', 'balcony', 'Balcón', 2),
  ('habitacion-malasana-demo', 'wifi', 'Wi‑Fi fibra', 0),
  ('habitacion-malasana-demo', 'local_laundry_service', 'Lavadora', 1),
  ('habitacion-malasana-demo', 'deck', 'Terraza', 2)
) AS a(slug, icon, label, ord) ON l.slug = a.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.habitus_listing_amenities la
  WHERE la.listing_id = l.id AND la.label = a.label
);

-- Pisos sin anfitrión = categoría «Piso para grupos»
UPDATE public.habitus_listings l
SET category_id = (SELECT id FROM public.habitus_categories WHERE slug = 'piso-grupo')
WHERE l.host_profile_id IS NULL
  AND l.status = 'published'
  AND l.slug NOT IN ('habitacion-eixample-demo', 'habitacion-malasana-demo');
