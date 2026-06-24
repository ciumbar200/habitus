-- Hybrid identity verification: MoOn Basic Trust + Stripe Identity.

ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_badge text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS basic_trust_verified_at timestamptz;

ALTER TABLE public.habitus_profiles
  DROP CONSTRAINT IF EXISTS habitus_profiles_verification_status_check;
ALTER TABLE public.habitus_profiles
  ADD CONSTRAINT habitus_profiles_verification_status_check CHECK (
    verification_status IN (
      'unverified', 'basic_pending', 'basic_ai_reviewed', 'basic_manual_review',
      'basic_approved', 'basic_rejected', 'stripe_pending', 'stripe_verified',
      'stripe_failed', 'advanced_required'
    )
  );

ALTER TABLE public.habitus_profiles
  DROP CONSTRAINT IF EXISTS habitus_profiles_verification_badge_check;
ALTER TABLE public.habitus_profiles
  ADD CONSTRAINT habitus_profiles_verification_badge_check CHECK (
    verification_badge IN ('none', 'basic_trust', 'identity_verified')
  );

CREATE TABLE IF NOT EXISTS public.verification_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('basic_trust', 'stripe_identity')),
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN (
    'unverified', 'basic_pending', 'basic_ai_reviewed', 'basic_manual_review',
    'basic_approved', 'basic_rejected', 'stripe_pending', 'stripe_verified',
    'stripe_failed', 'advanced_required'
  )),
  public_badge text NOT NULL DEFAULT 'none' CHECK (public_badge IN ('none', 'basic_trust', 'identity_verified')),
  document_front_path text,
  document_back_path text,
  selfie_path text,
  selfie_code_path text,
  liveness_code text,
  consent_at timestamptz,
  consent_version text,
  ai_result jsonb,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence_score numeric CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100),
  stripe_verification_session_id text UNIQUE,
  stripe_verification_report_id text,
  stripe_status text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  documents_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_checks_user_created_idx
  ON public.verification_checks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verification_checks_admin_queue_idx
  ON public.verification_checks (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_check_id uuid NOT NULL REFERENCES public.verification_checks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'ai', 'stripe')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_audit_logs_check_idx
  ON public.verification_audit_logs (verification_check_id, created_at DESC);

ALTER TABLE public.verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_checks_owner_read ON public.verification_checks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY verification_checks_admin_read ON public.verification_checks
  FOR SELECT TO authenticated USING (public.habitus_is_admin());
CREATE POLICY verification_checks_admin_update ON public.verification_checks
  FOR UPDATE TO authenticated USING (public.habitus_is_admin()) WITH CHECK (public.habitus_is_admin());

CREATE POLICY verification_audit_owner_read ON public.verification_audit_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY verification_audit_admin_read ON public.verification_audit_logs
  FOR SELECT TO authenticated USING (public.habitus_is_admin());

GRANT SELECT ON public.verification_checks, public.verification_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.verification_checks, public.verification_audit_logs
  TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents', 'verification-documents', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY verification_documents_owner_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY verification_documents_owner_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY verification_documents_admin_read ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'verification-documents' AND public.habitus_is_admin()
  );

CREATE OR REPLACE FUNCTION public.habitus_touch_verification_check()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_checks_touch ON public.verification_checks;
CREATE TRIGGER verification_checks_touch BEFORE UPDATE ON public.verification_checks
FOR EACH ROW EXECUTE FUNCTION public.habitus_touch_verification_check();

-- RLS is row-based, not column-based. Prevent authenticated clients from self-awarding
-- verification fields even if another profile UPDATE policy permits their own row.
CREATE OR REPLACE FUNCTION public.habitus_guard_profile_verification_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' AND (
    NEW.identity_status IS DISTINCT FROM OLD.identity_status
    OR NEW.identity_verified_at IS DISTINCT FROM OLD.identity_verified_at
    OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
    OR NEW.verification_badge IS DISTINCT FROM OLD.verification_badge
    OR NEW.basic_trust_verified_at IS DISTINCT FROM OLD.basic_trust_verified_at
  ) THEN
    RAISE EXCEPTION 'Los estados de verificación solo se modifican mediante el flujo seguro';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS habitus_profiles_guard_verification ON public.habitus_profiles;
CREATE TRIGGER habitus_profiles_guard_verification
BEFORE UPDATE ON public.habitus_profiles
FOR EACH ROW EXECUTE FUNCTION public.habitus_guard_profile_verification_fields();

CREATE OR REPLACE FUNCTION public.habitus_start_basic_verification(
  p_consent_version text DEFAULT '2026-06-07'
)
RETURNS public.verification_checks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_check public.verification_checks;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_check FROM public.verification_checks
  WHERE user_id = auth.uid() AND verification_type = 'basic_trust'
    AND status IN ('unverified', 'basic_pending', 'basic_ai_reviewed', 'basic_manual_review', 'advanced_required')
  ORDER BY created_at DESC LIMIT 1;

  IF v_check.id IS NULL THEN
    INSERT INTO public.verification_checks (
      user_id, verification_type, status, liveness_code, consent_at, consent_version,
      expires_at
    ) VALUES (
      auth.uid(), 'basic_trust', 'basic_pending', lpad((floor(random() * 10000))::int::text, 4, '0'),
      now(), left(p_consent_version, 40), now() + interval '30 days'
    ) RETURNING * INTO v_check;

    INSERT INTO public.verification_audit_logs
      (verification_check_id, user_id, actor_type, actor_id, action, metadata)
    VALUES (v_check.id, auth.uid(), 'user', auth.uid(), 'basic_started',
      jsonb_build_object('consent_version', p_consent_version));
  END IF;

  RETURN v_check;
END;
$$;

CREATE OR REPLACE FUNCTION public.habitus_submit_basic_verification(
  p_check_id uuid,
  p_document_front_path text,
  p_document_back_path text,
  p_selfie_path text,
  p_selfie_code_path text
)
RETURNS public.verification_checks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_check public.verification_checks; v_prefix text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  v_prefix := auth.uid()::text || '/' || p_check_id::text || '/';
  IF p_document_front_path NOT LIKE v_prefix || '%'
     OR p_selfie_path NOT LIKE v_prefix || '%'
     OR p_selfie_code_path NOT LIKE v_prefix || '%'
     OR (p_document_back_path IS NOT NULL AND p_document_back_path NOT LIKE v_prefix || '%') THEN
    RAISE EXCEPTION 'Ruta de documento no válida';
  END IF;

  UPDATE public.verification_checks SET
    document_front_path = p_document_front_path,
    document_back_path = p_document_back_path,
    selfie_path = p_selfie_path,
    selfie_code_path = p_selfie_code_path,
    status = 'basic_manual_review'
  WHERE id = p_check_id AND user_id = auth.uid() AND verification_type = 'basic_trust'
    AND status IN ('unverified', 'basic_pending', 'basic_rejected')
  RETURNING * INTO v_check;
  IF v_check.id IS NULL THEN RAISE EXCEPTION 'Verificación no encontrada o no editable'; END IF;

  UPDATE public.habitus_profiles SET verification_status = 'basic_manual_review', identity_status = 'pending'
  WHERE id = auth.uid();
  INSERT INTO public.verification_audit_logs
    (verification_check_id, user_id, actor_type, actor_id, action)
  VALUES (v_check.id, auth.uid(), 'user', auth.uid(), 'basic_submitted');
  RETURN v_check;
END;
$$;

REVOKE ALL ON FUNCTION public.habitus_start_basic_verification(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.habitus_submit_basic_verification(uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_start_basic_verification(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.habitus_submit_basic_verification(uuid,text,text,text,text) TO authenticated;

COMMENT ON TABLE public.verification_checks IS 'Sensitive internal verification state. Never expose document paths publicly.';
COMMENT ON COLUMN public.verification_checks.ai_result IS 'Non-authoritative pre-check. Manual approval remains mandatory.';
