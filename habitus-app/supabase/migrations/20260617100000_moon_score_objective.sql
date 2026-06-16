-- ============================================================================
-- Moon Score: señal OBJETIVA de "convivencia limpia" (sin incidencias graves)
-- ----------------------------------------------------------------------------
-- Extiende habitus_compute_moon_score (MISMO parámetro p_profile → sin colisión)
-- sumando +4 por cada convivencia confirmada sin incidencias 'high'/'urgent'
-- abiertas (tope +12). Así el Score deja de ser solo opinión (endosos) y suma
-- evidencia objetiva. + trigger: al cambiar una incidencia, recalcular el Score
-- de los miembros del grupo. + backfill de todos los perfiles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.habitus_compute_moon_score(p_profile uuid)
RETURNS smallint
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
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
          AND (e.cleanliness + e.respect + e.communication + e.payment) > 0) AS avg01,
      (SELECT COUNT(DISTINCT gm.group_id)::int
         FROM public.habitus_group_members gm
        WHERE gm.profile_id = p.id AND gm.is_confirmed = true
          AND NOT EXISTS (
            SELECT 1 FROM public.habitus_group_incident i
            WHERE i.group_id = gm.group_id
              AND i.severity IN ('high','urgent') AND i.status = 'open'
          )) AS clean_conv
    FROM public.habitus_profiles p
    WHERE p.id = p_profile
  )
  SELECT GREATEST(0, LEAST(100,
      (CASE WHEN s.badge = 'identity_verified' OR s.identity_status = 'verified' THEN 20
            WHEN s.badge = 'basic_trust'   OR s.identity_status = 'basic_trust' THEN 10
            ELSE 0 END)
    + LEAST(s.n_endorse, 5) * 12
    + COALESCE(ROUND(s.avg01 * 20)::int, 0)
    + LEAST(s.clean_conv, 3) * 4
  ))::smallint
  FROM signals s;
$function$;

-- Recalcular el Moon Score de los miembros confirmados de un grupo cuando
-- cambia una incidencia (abrir/resolver una grave sube/baja sus Scores).
CREATE OR REPLACE FUNCTION public.habitus_incident_recompute_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_group uuid;
  m record;
BEGIN
  v_group := COALESCE(NEW.group_id, OLD.group_id);
  IF v_group IS NOT NULL THEN
    FOR m IN
      SELECT profile_id FROM public.habitus_group_members
       WHERE group_id = v_group AND is_confirmed = true
    LOOP
      PERFORM public.habitus_recompute_moon_score(m.profile_id);
    END LOOP;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS habitus_incident_recompute_scores ON public.habitus_group_incidents;
CREATE TRIGGER habitus_incident_recompute_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.habitus_group_incidents
  FOR EACH ROW EXECUTE FUNCTION public.habitus_incident_recompute_scores();

-- Backfill: recalcular todos los Moon Scores con la nueva fórmula.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.habitus_profiles LOOP
    PERFORM public.habitus_recompute_moon_score(r.id);
  END LOOP;
END $$;
