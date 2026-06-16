-- ============================================================================
-- Incidencias de convivencia / mantenimiento dentro de un grupo (piso compartido)
-- ----------------------------------------------------------------------------
-- Botón "Reportar incidencia" en el grupo: lavadora rota, fuga de gas, caldera,
-- ruido, limpieza, etc. Parte del "OS de la convivencia": dinero + mantenimiento
-- + normas + confianza (Moon Score). El historial limpio alimenta la reputación.
--
-- IDEMPOTENTE: seguro de re-ejecutar. Reutiliza los helpers canónicos del sistema
-- de grupos (habitus_is_confirmed_group_member / habitus_is_group_lead) en vez de
-- redefinirlos (que chocaba con el parámetro p_group_id ya existente).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.habitus_group_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.habitus_groups(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',   -- appliance|plumbing|electrical|gas|security|cleanliness|noise|structural|other
  severity text NOT NULL DEFAULT 'normal',  -- low|normal|high|urgent
  status text NOT NULL DEFAULT 'open',      -- open|in_progress|resolved|dismissed
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT habitus_incidents_category CHECK (
    category IN ('appliance','plumbing','electrical','gas','security','cleanliness','noise','structural','other')
  ),
  CONSTRAINT habitus_incidents_severity CHECK (severity IN ('low','normal','high','urgent')),
  CONSTRAINT habitus_incidents_status CHECK (status IN ('open','in_progress','resolved','dismissed'))
);

CREATE INDEX IF NOT EXISTS habitus_incidents_group_idx ON public.habitus_group_incidents (group_id);
CREATE INDEX IF NOT EXISTS habitus_incidents_status_idx ON public.habitus_group_incidents (status);

COMMENT ON TABLE public.habitus_group_incidents IS
  'Incidencias de mantenimiento/convivencia dentro de un grupo (piso compartido).';

-- RLS ------------------------------------------------------------------------
ALTER TABLE public.habitus_group_incidents ENABLE ROW LEVEL SECURITY;

-- Limpia la función 'habitus_is_group_member_confirmed' creada por una versión
-- previa fallida de este archivo. Reutilizamos los helpers canónicos del sistema
-- de grupos (definidos en migrations de grupos, con parámetro p_group_id).
DROP FUNCTION IF EXISTS public.habitus_is_group_member_confirmed(uuid);

-- Lectura: miembros confirmados del grupo + admin
DROP POLICY IF EXISTS habitus_incidents_read ON public.habitus_group_incidents;
CREATE POLICY habitus_incidents_read ON public.habitus_group_incidents
  FOR SELECT
  USING (public.habitus_is_admin() OR public.habitus_is_confirmed_group_member(group_id));

-- Inserción: un miembro confirmado reporta en su propio nombre
DROP POLICY IF EXISTS habitus_incidents_insert ON public.habitus_group_incidents;
CREATE POLICY habitus_incidents_insert ON public.habitus_group_incidents
  FOR INSERT
  WITH CHECK (reported_by = auth.uid() AND public.habitus_is_confirmed_group_member(group_id));

-- Actualización: lead / admin / el propio reporter
DROP POLICY IF EXISTS habitus_incidents_update ON public.habitus_group_incidents;
CREATE POLICY habitus_incidents_update ON public.habitus_group_incidents
  FOR UPDATE
  USING (public.habitus_is_admin() OR public.habitus_is_group_lead(group_id) OR reported_by = auth.uid())
  WITH CHECK (public.habitus_is_admin() OR public.habitus_is_confirmed_group_member(group_id));

-- Borrado: admin o lead
DROP POLICY IF EXISTS habitus_incidents_delete ON public.habitus_group_incidents;
CREATE POLICY habitus_incidents_delete ON public.habitus_group_incidents
  FOR DELETE
  USING (public.habitus_is_admin() OR public.habitus_is_group_lead(group_id));

-- updated_at + resolved_at automáticos
CREATE OR REPLACE FUNCTION public.habitus_incidents_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF (NEW.status IN ('resolved','dismissed') AND NEW.resolved_at IS NULL) THEN
    NEW.resolved_at = now();
  ELSIF (NEW.status NOT IN ('resolved','dismissed')) THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS habitus_incidents_touch ON public.habitus_group_incidents;
CREATE TRIGGER habitus_incidents_touch
  BEFORE UPDATE ON public.habitus_group_incidents
  FOR EACH ROW EXECUTE FUNCTION public.habitus_incidents_touch();
