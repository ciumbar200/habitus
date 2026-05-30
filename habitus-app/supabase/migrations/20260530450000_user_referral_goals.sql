-- Programa de referidos para usuarios comunes (meta de 5 referidos)
-- Diferente del sistema de embajadores/influencers

-- Tabla de metas de referidos por usuario
CREATE TABLE IF NOT EXISTS public.habitus_referral_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  goal_count integer NOT NULL DEFAULT 5, -- Meta de 5 referidos
  current_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'rewarded')),
  achieved_at timestamp with time zone,
  rewarded_at timestamp with time zone,
  reward_type text CHECK (reward_type IN ('premium_month', 'discount', 'cashback', 'none')),
  reward_value numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_referral_goals_profile ON public.habitus_referral_goals(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_goals_status ON public.habitus_referral_goals(status);

-- Vista para contar referidos cualificados de un perfil
CREATE OR REPLACE VIEW public.user_referral_count AS
SELECT
  r.referrer_id as profile_id,
  COUNT(*) FILTER (WHERE r.status = 'qualified') as referral_count
FROM public.habitus_referrals r
GROUP BY r.referrer_id;

-- Función para actualizar el contador de referidos de un usuario
CREATE OR REPLACE FUNCTION public.update_referral_goal(p_profile_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_count integer;
  v_current_count integer;
  v_goal_status text;
BEGIN
  -- Obtener config actual
  SELECT goal_count, current_count, status INTO v_goal_count, v_current_count, v_goal_status
  FROM public.habitus_referral_goals
  WHERE profile_id = p_profile_id
  FOR UPDATE;

  -- Si no existe meta, crear una
  IF NOT FOUND THEN
    INSERT INTO public.habitus_referral_goals (profile_id)
    VALUES (p_profile_id)
    RETURNING current_count INTO v_current_count;
    v_goal_count := 5;
    v_goal_status := 'active';
  END IF;

  -- Actualizar contador con referidos cualificados
  UPDATE public.habitus_referral_goals g
  SET
    current_count = (
      SELECT COUNT(*)
      FROM public.habitus_referrals r
      WHERE r.referrer_id = p_profile_id
        AND r.status = 'qualified'
    ),
    updated_at = now()
  WHERE g.profile_id = p_profile_id
  RETURNING current_count INTO v_current_count;

  -- Verificar si se alcanzó la meta
  IF v_current_count >= v_goal_count AND v_goal_status = 'active' THEN
    UPDATE public.habitus_referral_goals
    SET
      status = 'achieved',
      achieved_at = now(),
      updated_at = now()
    WHERE profile_id = p_profile_id;

    RETURN true; -- Meta alcanzada
  END IF;

  RETURN false; -- Meta no alcanzada aún
END;
$$;

-- Trigger automático para actualizar meta cuando un referido se cualifica
CREATE OR REPLACE FUNCTION public.check_referral_goal_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando el status cambia a 'qualified'
  IF (NEW.status = 'qualified' AND OLD.status IS DISTINCT FROM 'qualified')
     OR (NEW.status = 'qualified' AND OLD.status IS NULL) THEN
    PERFORM public.update_referral_goal(NEW.referrer_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger en tabla de referidos
DROP TRIGGER IF EXISTS referral_goal_check ON public.habitus_referrals;
CREATE TRIGGER referral_goal_check
  AFTER UPDATE OR INSERT ON public.habitus_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_goal_achievement();

-- Función para obtener stats de referidos de un usuario
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(p_profile_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  profile_id uuid,
  goal_count integer,
  current_count integer,
  status text,
  remaining_count integer,
  achieved_at timestamp with time zone,
  rewarded_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.profile_id,
    g.goal_count,
    g.current_count,
    g.status,
    g.goal_count - g.current_count as remaining_count,
    g.achieved_at,
    g.rewarded_at
  FROM public.habitus_referral_goals g
  WHERE g.profile_id = p_profile_id;
$$;

-- Función para reclamar recompensa de meta de referidos
CREATE OR REPLACE FUNCTION public.claim_referral_reward(p_profile_id uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_status text;
  v_achieved_at timestamp with time zone;
  v_reward_type text := 'premium_month';
  v_reward_value numeric := 1;
BEGIN
  SELECT status, achieved_at INTO v_goal_status, v_achieved_at
  FROM public.habitus_referral_goals
  WHERE profile_id = p_profile_id;

  IF v_goal_status != 'achieved' THEN
    RETURN json_build_object('error', 'Meta no alcanzada aún', 'status', v_goal_status);
  END IF;

  -- Marcar como recompensado
  UPDATE public.habitus_referral_goals
  SET
    status = 'rewarded',
    rewarded_at = now(),
    reward_type = v_reward_type,
    reward_value = v_reward_value,
    updated_at = now()
  WHERE profile_id = p_profile_id;

  RETURN json_build_object(
    'success', true,
    'reward_type', v_reward_type,
    'reward_value', v_reward_value,
    'message', '¡Felicidades! Has alcanzado 5 referidos. Obtienes 1 mes gratis de premium.'
  );
END;
$$;

-- RLS para metas de referidos
ALTER TABLE public.habitus_referral_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_goals_select_own ON public.habitus_referral_goals
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

CREATE POLICY referral_goals_insert_admin ON public.habitus_referral_goals
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_is_admin());

CREATE POLICY referral_goals_update_admin ON public.habitus_referral_goals
  FOR UPDATE TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Comentarios
COMMENT ON TABLE public.habitus_referral_goals IS 'Programa de referidos para usuarios comunes: meta de 5 referidos para obtener recompensas';
COMMENT ON COLUMN public.habitus_referral_goals.goal_count IS 'Número de referidos necesarios para lograr la meta (default: 5)';
COMMENT ON COLUMN public.habitus_referral_goals.reward_type IS 'Tipo de recompensa: premium_month, discount, cashback';
COMMENT ON FUNCTION public.update_referral_goal IS 'Actualiza el contador de referidos cualificados y verifica si se alcanzó la meta';
COMMENT ON FUNCTION public.claim_referral_reward IS 'Reclama la recompensa cuando se alcanza la meta de 5 referidos';
