-- ============================================================================
-- moon Score: reputación PORTABLE del conviviente (el moat "LinkedIn del co-living")
-- ----------------------------------------------------------------------------
-- Endosos de compañeros de piso (valoración 1-5 en 4 dimensiones) + score 0-100
-- cacheado en habitus_profiles. Ortogonal a profile_score (que mide COMPLETITUD
-- del perfil). moon_score mide REPUTACIÓN de conviviente: lo que importa para
-- confiar en alguien al compartir piso, y lo que nadie en España tiene todavía.
-- ============================================================================

-- 1) Columnas cacheadas en habitus_profiles ----------------------------------
ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS moon_score smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moon_score_endorsements smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moon_score_updated_at timestamptz;

COMMENT ON COLUMN public.habitus_profiles.moon_score IS
  'Moon Score (0-100): reputacion portable del conviviente basada en endosos. Distinto de profile_score (completitud).';
COMMENT ON COLUMN public.habitus_profiles.moon_score_endorsements IS
  'Numero de endosos validos que alimentan el Moon Score.';

-- 2) Tabla de endosos --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habitus_roommate_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsee_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  -- referencia laxa a la convivencia (listing/assignment). Texto en V1 para no acoplar FKs.
  convivencia_ref text,
  -- dimensiones 1-5 (0 = sin respuesta)
  cleanliness smallint NOT NULL DEFAULT 0,
  respect smallint NOT NULL DEFAULT 0,
  communication smallint NOT NULL DEFAULT 0,
  payment smallint NOT NULL DEFAULT 0,
  would_live_again boolean NOT NULL DEFAULT true,
  comment text,
  weight numeric NOT NULL DEFAULT 1.0, -- peso por credibilidad del endosante (reservado)
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT habitus_endorsements_no_self CHECK (endorser_id <> endorsee_id),
  CONSTRAINT habitus_endorsements_dim_range CHECK (
    cleanliness BETWEEN 0 AND 5
    AND respect BETWEEN 0 AND 5
    AND communication BETWEEN 0 AND 5
    AND payment BETWEEN 0 AND 5
  )
);

-- Un endosante valora a un conviviente una sola vez por convivencia
-- (o una vez única si no hay convivencia_ref).
CREATE UNIQUE INDEX IF NOT EXISTS habitus_endorsements_unique_idx
  ON public.habitus_roommate_endorsements (endorser_id, endorsee_id, COALESCE(convivencia_ref, ''));

CREATE INDEX IF NOT EXISTS habitus_endorsements_endorsee_idx
  ON public.habitus_roommate_endorsements (endorsee_id);

COMMENT ON TABLE public.habitus_roommate_endorsements IS
  'Endosos de convivientes: valoracion de un companero de piso sobre otro. Base del Moon Score.';

-- 3) RLS ---------------------------------------------------------------------
ALTER TABLE public.habitus_roommate_endorsements ENABLE ROW LEVEL SECURITY;

-- Transparencia: el endosado ve quien lo endoso; el endosante ve los suyos; admin todo.
-- (El agregado publico es el moon_score cacheado en el perfil, no las valoraciones individuales.)
DROP POLICY IF EXISTS habitus_endorsements_read ON public.habitus_roommate_endorsements;
CREATE POLICY habitus_endorsements_read ON public.habitus_roommate_endorsements
  FOR SELECT
  USING (
    public.habitus_is_admin()
    OR endorser_id = auth.uid()
    OR endorsee_id = auth.uid()
  );

-- Cualquier usuario autenticado crea su propio endoso (endorser = el mismo).
DROP POLICY IF EXISTS habitus_endorsements_insert ON public.habitus_roommate_endorsements;
CREATE POLICY habitus_endorsements_insert ON public.habitus_roommate_endorsements
  FOR INSERT
  WITH CHECK (endorser_id = auth.uid());

-- El endosante edita/borra SU endoso; admin todo.
DROP POLICY IF EXISTS habitus_endorsements_modify ON public.habitus_roommate_endorsements;
CREATE POLICY habitus_endorsements_modify ON public.habitus_roommate_endorsements
  FOR UPDATE
  USING (public.habitus_is_admin() OR endorser_id = auth.uid())
  WITH CHECK (endorser_id = auth.uid());

DROP POLICY IF EXISTS habitus_endorsements_delete ON public.habitus_roommate_endorsements;
CREATE POLICY habitus_endorsements_delete ON public.habitus_roommate_endorsements
  FOR DELETE
  USING (public.habitus_is_admin() OR endorser_id = auth.uid());

-- 4) Calculo del Moon Score (SECURITY DEFINER: lee endosos sin friccion de RLS) -
-- Formula (espejo de computeMoonScore() en @habitus-core):
--   identidad verificada +20  | basic_trust +10  | resto 0
--   + min(n_endosos, 5) * 12        -> hasta +60 (prueba social, rendim. decreciente)
--   + round(avg_rating_01 * 20)     -> hasta +20 (rating medio de las 4 dimensiones)
--   clamp [0,100]
CREATE OR REPLACE FUNCTION public.habitus_compute_moon_score(p_profile uuid)
RETURNS smallint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH signals AS (
    SELECT
      p.identity_status,
      COALESCE(p.verification_badge, 'none') AS badge,
      (SELECT COUNT(*)::int
         FROM public.habitus_roommate_endorsements e
        WHERE e.endorsee_id = p.id) AS n_endorse,
      (SELECT AVG((e.cleanliness + e.respect + e.communication + e.payment) / 20.0)
         FROM public.habitus_roommate_endorsements e
        WHERE e.endorsee_id = p.id
          AND (e.cleanliness + e.respect + e.communication + e.payment) > 0) AS avg01
    FROM public.habitus_profiles p
    WHERE p.id = p_profile
  )
  SELECT GREATEST(0, LEAST(100,
      (CASE WHEN s.badge = 'identity_verified' OR s.identity_status = 'verified' THEN 20
            WHEN s.badge = 'basic_trust'   OR s.identity_status = 'basic_trust' THEN 10
            ELSE 0 END)
    + LEAST(s.n_endorse, 5) * 12
    + COALESCE(ROUND(s.avg01 * 20)::int, 0)
  ))::smallint
  FROM signals s;
$function$;

-- 5) Recomputar y cachear en el perfil ---------------------------------------
CREATE OR REPLACE FUNCTION public.habitus_recompute_moon_score(p_profile uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_score smallint;
  v_count int;
BEGIN
  SELECT public.habitus_compute_moon_score(p_profile) INTO v_score;
  SELECT COUNT(*)::int INTO v_count
    FROM public.habitus_roommate_endorsements
   WHERE endorsee_id = p_profile;
  UPDATE public.habitus_profiles
     SET moon_score = v_score,
         moon_score_endorsements = v_count,
         moon_score_updated_at = now()
   WHERE id = p_profile;
END;
$function$;

-- 6) Trigger: al cambiar un endoso, recalcular el score del endosado ---------
CREATE OR REPLACE FUNCTION public.habitus_endorsement_recompute_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.habitus_recompute_moon_score(OLD.endorsee_id);
    RETURN OLD;
  END IF;
  PERFORM public.habitus_recompute_moon_score(NEW.endorsee_id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS habitus_endorsement_recompute ON public.habitus_roommate_endorsements;
CREATE TRIGGER habitus_endorsement_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.habitus_roommate_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION public.habitus_endorsement_recompute_trigger();

-- 7) Backfill inicial: base de identidad para perfiles existentes ------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.habitus_profiles LOOP
    PERFORM public.habitus_recompute_moon_score(r.id);
  END LOOP;
END $$;
