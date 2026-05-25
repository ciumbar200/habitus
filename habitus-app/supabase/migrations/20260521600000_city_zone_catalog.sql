-- Ciudad + zona: slugs canónicos en listings y grupos

ALTER TABLE public.habitus_groups
  ADD COLUMN IF NOT EXISTS zone text;

COMMENT ON COLUMN public.habitus_groups.zone IS 'Slug de zona del catálogo Moon (dependiente de city).';

-- Normalizar city en listings
UPDATE public.habitus_listings
SET city = CASE
  WHEN lower(trim(city)) IN ('barcelona', 'bcn') THEN 'barcelona'
  WHEN lower(trim(city)) IN ('madrid', 'mad') THEN 'madrid'
  WHEN lower(trim(city)) IN ('valencia', 'vlc') THEN 'valencia'
  WHEN lower(trim(city)) IN ('sevilla', 'seville', 'svq') THEN 'sevilla'
  WHEN lower(trim(city)) IN ('granada', 'grx') THEN 'granada'
  ELSE lower(trim(city))
END
WHERE city IS NOT NULL AND trim(city) <> '';

-- Normalizar location → slug de zona (listings)
UPDATE public.habitus_listings
SET location = CASE
  WHEN slug = 'habitacion-eixample-demo' THEN 'eixample'
  WHEN slug = 'habitacion-malasana-demo' THEN 'malasana'
  WHEN lower(trim(location)) IN ('eixample', 'eixample, barcelona') THEN 'eixample'
  WHEN lower(trim(location)) LIKE '%malasa%' THEN 'malasana'
  WHEN lower(trim(location)) LIKE '%gràcia%' OR lower(trim(location)) LIKE '%gracia%' THEN 'gracia'
  WHEN lower(trim(location)) LIKE '%poblenou%' THEN 'poblenou'
  WHEN lower(trim(location)) LIKE '%gavà%' OR lower(trim(location)) LIKE '%gava%' THEN 'gava'
  WHEN lower(trim(location)) LIKE '%viladecans%' THEN 'viladecans'
  WHEN lower(trim(location)) LIKE '%sant celoni%' THEN 'sant-celoni'
  WHEN lower(trim(location)) LIKE '%centro%' AND city = 'madrid' THEN 'centro'
  WHEN lower(trim(location)) LIKE '%centro%' AND city = 'granada' THEN 'centro'
  WHEN lower(trim(location)) LIKE '%centro%' AND city = 'sevilla' THEN 'centro'
  WHEN lower(trim(location)) LIKE '%centro%' AND city = 'valencia' THEN 'ciutat-vella'
  ELSE lower(regexp_replace(trim(location), '[,].*$', ''))
END
WHERE location IS NOT NULL AND trim(location) <> '';

-- Normalizar city en grupos
UPDATE public.habitus_groups
SET city = CASE
  WHEN lower(trim(city)) IN ('barcelona', 'bcn') THEN 'barcelona'
  WHEN lower(trim(city)) IN ('madrid', 'mad') THEN 'madrid'
  WHEN lower(trim(city)) IN ('valencia', 'vlc') THEN 'valencia'
  WHEN lower(trim(city)) IN ('sevilla', 'seville', 'svq') THEN 'sevilla'
  WHEN lower(trim(city)) IN ('granada', 'grx') THEN 'granada'
  ELSE lower(trim(city))
END
WHERE city IS NOT NULL AND trim(city) <> '';

-- Demo listings: slugs explícitos
UPDATE public.habitus_listings
SET city = 'barcelona', location = 'eixample'
WHERE slug = 'habitacion-eixample-demo';

UPDATE public.habitus_listings
SET city = 'madrid', location = 'malasana'
WHERE slug = 'habitacion-malasana-demo';
