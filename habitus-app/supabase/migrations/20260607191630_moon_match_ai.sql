-- MoOn Match AI: persisted, reviewable outputs for focused AI agents.

CREATE TABLE IF NOT EXISTS public.user_ai_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_ai_profiles (
  property_id uuid PRIMARY KEY REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_ai_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  match_score numeric CHECK (match_score BETWEEN 0 AND 100),
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.listing_quality_reports (
  property_id uuid PRIMARY KEY REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  quality_score numeric CHECK (quality_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- verification_checks already exists in the hybrid verification migration and stores basicTrustAgent results.
CREATE TABLE IF NOT EXISTS public.safety_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('listing', 'profile', 'message')),
  subject_id text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS safety_reviews_subject_hash_idx
  ON public.safety_reviews(subject_type, subject_id, input_hash);

CREATE TABLE IF NOT EXISTS public.operator_ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  input_hash text NOT NULL,
  result jsonb NOT NULL,
  model_used text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  model_used text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.habitus_listings(id) ON DELETE SET NULL,
  input_hash text,
  status text NOT NULL CHECK (status IN ('started', 'success', 'cached', 'error', 'rate_limited', 'not_configured')),
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_day_idx ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_agent_idx ON public.ai_usage_logs(agent_name, created_at DESC);

ALTER TABLE public.user_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_ai_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_ai_profiles_read ON public.user_ai_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.habitus_is_admin());
CREATE POLICY property_ai_profiles_read ON public.property_ai_profiles FOR SELECT TO authenticated
  USING (public.habitus_is_admin() OR EXISTS (
    SELECT 1 FROM public.habitus_listings l WHERE l.id = property_id
      AND (l.visibility = 'public' OR l.owner_profile_id = auth.uid() OR l.host_profile_id = auth.uid())
  ));
CREATE POLICY match_ai_scores_read ON public.match_ai_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.habitus_is_admin() OR EXISTS (
    SELECT 1 FROM public.habitus_listings l WHERE l.id = property_id
      AND (l.owner_profile_id = auth.uid() OR l.host_profile_id = auth.uid())
  ));
CREATE POLICY listing_quality_reports_read ON public.listing_quality_reports FOR SELECT TO authenticated
  USING (public.habitus_is_admin() OR EXISTS (
    SELECT 1 FROM public.habitus_listings l WHERE l.id = property_id
      AND (l.owner_profile_id = auth.uid() OR l.host_profile_id = auth.uid())
  ));
CREATE POLICY safety_reviews_admin_read ON public.safety_reviews FOR SELECT TO authenticated
  USING (public.habitus_is_admin());
CREATE POLICY operator_ai_reports_read ON public.operator_ai_reports FOR SELECT TO authenticated
  USING (operator_id = auth.uid() OR public.habitus_is_admin());
CREATE POLICY ai_usage_logs_admin_read ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (public.habitus_is_admin());

GRANT SELECT ON public.user_ai_profiles, public.property_ai_profiles, public.match_ai_scores,
  public.listing_quality_reports, public.safety_reviews, public.operator_ai_reports,
  public.ai_usage_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_touch_ai_result()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user_ai_profiles', 'property_ai_profiles', 'match_ai_scores',
    'listing_quality_reports', 'safety_reviews', 'operator_ai_reports'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.habitus_touch_ai_result()', table_name, table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.ai_usage_logs IS 'Server-written AI Gateway usage and failure log. No prompts or secrets are stored.';
COMMENT ON TABLE public.safety_reviews IS 'Non-authoritative AI risk triage. Medium/high results require human review.';
