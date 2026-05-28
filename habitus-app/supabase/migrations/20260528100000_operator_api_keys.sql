-- Operator API keys for external integrations.
-- Non-destructive: new table only, no existing columns or rows are altered.

CREATE TABLE IF NOT EXISTS public.habitus_operator_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['listings:read', 'listings:write', 'applications:read'],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.habitus_operator_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_operator_api_keys_select ON public.habitus_operator_api_keys;
CREATE POLICY habitus_operator_api_keys_select ON public.habitus_operator_api_keys
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_operator_api_keys_insert ON public.habitus_operator_api_keys;
CREATE POLICY habitus_operator_api_keys_insert ON public.habitus_operator_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_operator_api_keys_update ON public.habitus_operator_api_keys;
CREATE POLICY habitus_operator_api_keys_update ON public.habitus_operator_api_keys
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_operator_api_keys_delete ON public.habitus_operator_api_keys;
CREATE POLICY habitus_operator_api_keys_delete ON public.habitus_operator_api_keys
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

CREATE INDEX IF NOT EXISTS habitus_operator_api_keys_profile_idx
  ON public.habitus_operator_api_keys (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS habitus_operator_api_keys_prefix_idx
  ON public.habitus_operator_api_keys (key_prefix);
