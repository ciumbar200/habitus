-- Roadmap: consents, leases, expenses, moon access, group applications

-- ─── Helpers ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.habitus_is_confirmed_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.habitus_group_members
    WHERE group_id = p_group_id
      AND profile_id = auth.uid()
      AND is_confirmed = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.habitus_is_confirmed_group_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.habitus_is_group_lead(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.habitus_group_members
    WHERE group_id = p_group_id
      AND profile_id = auth.uid()
      AND role = 'lead'
      AND is_confirmed = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.habitus_is_group_lead(uuid) TO authenticated;

-- ─── Consents (RGPD) ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habitus_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('privacy', 'terms', 'cookies')),
  doc_version text NOT NULL DEFAULT '2026-05-21',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS habitus_consents_profile_idx ON public.habitus_consents(profile_id, doc_type);

ALTER TABLE public.habitus_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_consents_own_insert ON public.habitus_consents;
CREATE POLICY habitus_consents_own_insert ON public.habitus_consents
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS habitus_consents_own_read ON public.habitus_consents;
CREATE POLICY habitus_consents_own_read ON public.habitus_consents
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

-- ─── Applications: group_id ────────────────────────────────────────────────

ALTER TABLE public.habitus_applications
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.habitus_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS habitus_applications_group_idx ON public.habitus_applications(group_id);

-- ─── Leases / contracts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habitus_contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL DEFAULT 'ES',
  template_type text NOT NULL DEFAULT 'room' CHECK (template_type IN ('room', 'full_flat')),
  name text NOT NULL,
  body_html text,
  external_template_id text,
  version text NOT NULL DEFAULT '1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitus_leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.habitus_listings(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.habitus_groups(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.habitus_applications(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_signatures', 'active', 'ended', 'cancelled')),
  start_date date,
  end_date date,
  monthly_rent numeric(10,2),
  deposit_amount numeric(10,2),
  contract_pdf_url text,
  template_id uuid REFERENCES public.habitus_contract_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitus_lease_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL REFERENCES public.habitus_leases(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  party_role text NOT NULL CHECK (party_role IN ('tenant', 'owner', 'host', 'guarantor')),
  signed_at timestamptz,
  signature_external_id text,
  UNIQUE (lease_id, profile_id)
);

CREATE INDEX IF NOT EXISTS habitus_leases_listing_idx ON public.habitus_leases(listing_id);
CREATE INDEX IF NOT EXISTS habitus_leases_group_idx ON public.habitus_leases(group_id);
CREATE INDEX IF NOT EXISTS habitus_lease_parties_lease_idx ON public.habitus_lease_parties(lease_id);

ALTER TABLE public.habitus_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_lease_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_contract_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_contract_templates_read ON public.habitus_contract_templates;
CREATE POLICY habitus_contract_templates_read ON public.habitus_contract_templates
  FOR SELECT TO authenticated
  USING (is_active = true OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_leases_party_read ON public.habitus_leases;
CREATE POLICY habitus_leases_party_read ON public.habitus_leases
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.habitus_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.habitus_lease_parties lp
      WHERE lp.lease_id = habitus_leases.id AND lp.profile_id = auth.uid()
    )
    OR (group_id IS NOT NULL AND public.habitus_is_confirmed_group_member(group_id))
  );

DROP POLICY IF EXISTS habitus_leases_owner_insert ON public.habitus_leases;
CREATE POLICY habitus_leases_owner_insert ON public.habitus_leases
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_leases_owner_update ON public.habitus_leases;
CREATE POLICY habitus_leases_owner_update ON public.habitus_leases
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.habitus_is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_lease_parties_read ON public.habitus_lease_parties;
CREATE POLICY habitus_lease_parties_read ON public.habitus_lease_parties
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.habitus_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.habitus_leases l
      WHERE l.id = lease_id AND (l.owner_id = auth.uid() OR public.habitus_is_confirmed_group_member(l.group_id))
    )
  );

DROP POLICY IF EXISTS habitus_lease_parties_insert ON public.habitus_lease_parties;
CREATE POLICY habitus_lease_parties_insert ON public.habitus_lease_parties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.habitus_is_admin()
    OR EXISTS (SELECT 1 FROM public.habitus_leases l WHERE l.id = lease_id AND l.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS habitus_lease_parties_update_own ON public.habitus_lease_parties;
CREATE POLICY habitus_lease_parties_update_own ON public.habitus_lease_parties
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.habitus_is_admin());

-- ─── Household expenses ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habitus_household_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.habitus_groups(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.habitus_leases(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('rent', 'utilities', 'internet', 'cleaning', 'groceries', 'repair', 'other')),
  label text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR',
  split_mode text NOT NULL DEFAULT 'proportional'
    CHECK (split_mode IN ('proportional', 'equal', 'custom')),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  recurrence text CHECK (recurrence IS NULL OR recurrence IN ('weekly', 'monthly', 'yearly')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitus_expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.habitus_household_expenses(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  share_cents integer NOT NULL CHECK (share_cents >= 0),
  weight numeric(6,2),
  UNIQUE (expense_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.habitus_expense_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.habitus_groups(id) ON DELETE CASCADE,
  from_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  to_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  note text,
  settled_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS habitus_expenses_group_idx ON public.habitus_household_expenses(group_id);
CREATE INDEX IF NOT EXISTS habitus_expense_splits_expense_idx ON public.habitus_expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS habitus_settlements_group_idx ON public.habitus_expense_settlements(group_id);

ALTER TABLE public.habitus_household_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_expense_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_expenses_member_read ON public.habitus_household_expenses;
CREATE POLICY habitus_expenses_member_read ON public.habitus_household_expenses
  FOR SELECT TO authenticated
  USING (public.habitus_is_confirmed_group_member(group_id) OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_expenses_member_insert ON public.habitus_household_expenses;
CREATE POLICY habitus_expenses_member_insert ON public.habitus_household_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.habitus_is_confirmed_group_member(group_id)
  );

DROP POLICY IF EXISTS habitus_expense_splits_read ON public.habitus_expense_splits;
CREATE POLICY habitus_expense_splits_read ON public.habitus_expense_splits
  FOR SELECT TO authenticated
  USING (
    public.habitus_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.habitus_household_expenses e
      WHERE e.id = expense_id AND public.habitus_is_confirmed_group_member(e.group_id)
    )
  );

DROP POLICY IF EXISTS habitus_expense_splits_insert ON public.habitus_expense_splits;
CREATE POLICY habitus_expense_splits_insert ON public.habitus_expense_splits
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habitus_household_expenses e
      WHERE e.id = expense_id
        AND e.created_by = auth.uid()
        AND public.habitus_is_confirmed_group_member(e.group_id)
    )
  );

DROP POLICY IF EXISTS habitus_settlements_member ON public.habitus_expense_settlements;
CREATE POLICY habitus_settlements_member ON public.habitus_expense_settlements
  FOR ALL TO authenticated
  USING (public.habitus_is_confirmed_group_member(group_id) OR public.habitus_is_admin())
  WITH CHECK (
    recorded_by = auth.uid()
    AND public.habitus_is_confirmed_group_member(group_id)
  );

-- ─── Moon Access (sin Stripe por ahora) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habitus_platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.habitus_platform_config (key, value)
VALUES
  ('moon_access_enabled', 'false'::jsonb),
  ('moon_access_show_pricing', 'false'::jsonb),
  ('moon_access_user_threshold', '1000'::jsonb),
  ('moon_access_price_eur', '9'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.habitus_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'moon_access' CHECK (plan IN ('moon_access')),
  status text NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, plan)
);

CREATE TABLE IF NOT EXISTS public.habitus_relocation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.habitus_groups(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'matching', 'relocated', 'closed')),
  assigned_listing_id uuid REFERENCES public.habitus_listings(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.habitus_platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitus_relocation_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_platform_config_admin ON public.habitus_platform_config;
CREATE POLICY habitus_platform_config_admin ON public.habitus_platform_config
  FOR ALL TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_subscriptions_own ON public.habitus_subscriptions;
CREATE POLICY habitus_subscriptions_own ON public.habitus_subscriptions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_relocation_own_read ON public.habitus_relocation_cases;
CREATE POLICY habitus_relocation_own_read ON public.habitus_relocation_cases
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_relocation_admin ON public.habitus_relocation_cases;
CREATE POLICY habitus_relocation_admin ON public.habitus_relocation_cases
  FOR ALL TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Seed default contract template
INSERT INTO public.habitus_contract_templates (jurisdiction, template_type, name, body_html, version)
SELECT 'ES', 'room', 'Contrato habitación LAU (borrador)', '<p>Plantilla pendiente de revisión legal.</p>', '1'
WHERE NOT EXISTS (SELECT 1 FROM public.habitus_contract_templates WHERE name = 'Contrato habitación LAU (borrador)');
