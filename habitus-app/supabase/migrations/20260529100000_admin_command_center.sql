-- ADM-01: Admin Command Center Foundation
-- Columnas nuevas en habitus_profiles
ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS suspended_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS admin_role    text
    CHECK (admin_role IN ('support', 'super'));

-- Tabla audit log (append-only por diseño — sin policy UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        REFERENCES public.habitus_profiles(id) ON DELETE SET NULL,
  action      text        NOT NULL,
  target_type text        NOT NULL,
  target_id   text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_audit_log_read   ON public.admin_audit_log;
CREATE POLICY admin_audit_log_read ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.habitus_is_admin());
DROP POLICY IF EXISTS admin_audit_log_insert ON public.admin_audit_log;
CREATE POLICY admin_audit_log_insert ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.habitus_is_admin());

-- Tabla introducciones curadas por admin
CREATE TABLE IF NOT EXISTS public.admin_introductions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id            uuid        REFERENCES public.habitus_profiles(id) ON DELETE SET NULL,
  profile_id          uuid        NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  listing_id          uuid        REFERENCES public.habitus_listings(id) ON DELETE SET NULL,
  group_id            uuid        REFERENCES public.habitus_groups(id) ON DELETE SET NULL,
  compatibility_score integer,
  internal_notes      text,
  status              text        NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','notified','accepted','rejected','expired')),
  application_id      uuid,
  notified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_introductions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_introductions_admin_all  ON public.admin_introductions;
CREATE POLICY admin_introductions_admin_all ON public.admin_introductions
  FOR ALL TO authenticated
  USING (public.habitus_is_admin()) WITH CHECK (public.habitus_is_admin());
DROP POLICY IF EXISTS admin_introductions_user_read ON public.admin_introductions;
CREATE POLICY admin_introductions_user_read ON public.admin_introductions
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- RPC: usuarios con email (SECURITY DEFINER, solo admins)
CREATE OR REPLACE FUNCTION public.habitus_admin_get_users_with_email()
RETURNS TABLE (
  id uuid, email text, display_name text, account_role text,
  admin_role text, is_admin boolean, is_discoverable boolean,
  identity_status text, profile_score integer,
  suspended_at timestamptz, deleted_at timestamptz,
  city text, onboarding_completed_at timestamptz, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
  IF NOT public.habitus_is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT p.id, u.email::text, p.display_name, p.account_role::text,
           p.admin_role, p.is_admin, p.is_discoverable, p.identity_status,
           p.profile_score, p.suspended_at, p.deleted_at,
           p.city, p.onboarding_completed_at, u.created_at
    FROM public.habitus_profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY u.created_at DESC LIMIT 500;
END; $$;
REVOKE ALL ON FUNCTION public.habitus_admin_get_users_with_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_get_users_with_email() TO authenticated;

-- RPC: escribir en audit log
CREATE OR REPLACE FUNCTION public.habitus_admin_write_audit_log(
  p_admin_id uuid, p_action text, p_target_type text,
  p_target_id text, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.habitus_is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, payload)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_payload) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.habitus_admin_write_audit_log(uuid,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_write_audit_log(uuid,text,text,text,jsonb) TO authenticated;
