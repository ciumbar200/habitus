-- Programa de referidos: código único por perfil + registro de invitaciones

ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS referral_code text;

CREATE UNIQUE INDEX IF NOT EXISTS habitus_profiles_referral_code_uq
  ON public.habitus_profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.habitus_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'qualified'
    CHECK (status IN ('pending', 'qualified')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS habitus_referrals_referrer_idx
  ON public.habitus_referrals (referrer_id);

ALTER TABLE public.habitus_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_referrals_read_own ON public.habitus_referrals;
CREATE POLICY habitus_referrals_read_own ON public.habitus_referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.habitus_is_admin());

CREATE OR REPLACE FUNCTION public.habitus_generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_tries integer := 0;
BEGIN
  LOOP
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.habitus_profiles WHERE referral_code = v_code
    );
    v_tries := v_tries + 1;
    IF v_tries > 20 THEN
      RAISE EXCEPTION 'No se pudo generar código de referido';
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.habitus_get_or_create_referral_code(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF p_profile_id IS DISTINCT FROM auth.uid() AND NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT referral_code INTO v_code
  FROM public.habitus_profiles
  WHERE id = p_profile_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := public.habitus_generate_referral_code();

  UPDATE public.habitus_profiles
  SET referral_code = v_code, updated_at = now()
  WHERE id = p_profile_id;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_get_or_create_referral_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_get_or_create_referral_code(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_record_referral(p_referrer_code text, p_referred_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  IF p_referrer_code IS NULL OR length(trim(p_referrer_code)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_referrer_id
  FROM public.habitus_profiles
  WHERE lower(referral_code) = lower(trim(p_referrer_code));

  IF v_referrer_id IS NULL THEN
    RETURN 'Código de referido no válido';
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN 'No puedes referirte a ti mismo';
  END IF;

  IF EXISTS (SELECT 1 FROM public.habitus_referrals WHERE referred_id = p_referred_id) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.habitus_referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_referred_id, 'qualified');

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_record_referral(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_record_referral(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_referral_stats(p_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_code text;
  v_count integer;
BEGIN
  IF p_profile_id IS DISTINCT FROM auth.uid() AND NOT public.habitus_is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT referral_code INTO v_code FROM public.habitus_profiles WHERE id = p_profile_id;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.habitus_referrals
  WHERE referrer_id = p_profile_id AND status = 'qualified';

  RETURN json_build_object(
    'referralCode', v_code,
    'qualifiedCount', v_count,
    'goal', 5
  );
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_referral_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_referral_stats(uuid) TO authenticated;
