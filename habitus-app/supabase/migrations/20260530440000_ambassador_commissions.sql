-- Sistema de comisiones para embajadores
-- Los embajadores ganan comisiones cuando sus referidos se hacen premium o pagan contratos (después de 2 meses)

-- Tabla de comisiones de embajadores
CREATE TABLE IF NOT EXISTS public.habitus_ambassador_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  commission_type text NOT NULL CHECK (commission_type IN ('premium_conversion', 'contract_payment', 'manual')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  event_date timestamp with time zone NOT NULL,
  conversion_date timestamp with time zone, -- Fecha en que el referido se convirtió (pagó contrato/premium)
  notes text,
  approved_by uuid REFERENCES public.habitus_profiles(id), -- Admin que aprobó la comisión
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT unique_ambassador_referred_event UNIQUE (ambassador_profile_id, referred_profile_id, commission_type, event_date)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_ambassador_commissions_ambassador ON public.habitus_ambassador_commissions(ambassador_profile_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_commissions_referred ON public.habitus_ambassador_commissions(referred_profile_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_commissions_status ON public.habitus_ambassador_commissions(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_commissions_conversion ON public.habitus_ambassador_commissions(conversion_date);

-- Vista para estadísticas de comisiones por embajador
CREATE OR REPLACE VIEW public.ambassador_commission_stats AS
SELECT
  ac.ambassador_profile_id,
  p.display_name as ambassador_name,
  p.email as ambassador_email,
  COUNT(*) FILTER (WHERE ac.status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE ac.status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE ac.status = 'paid') as paid_count,
  COALESCE(SUM(ac.amount) FILTER (WHERE ac.status = 'paid'), 0) as total_paid,
  COALESCE(SUM(ac.amount) FILTER (WHERE ac.status = 'approved'), 0) as total_approved,
  COALESCE(SUM(ac.amount) FILTER (WHERE ac.status = 'pending'), 0) as total_pending
FROM public.habitus_ambassador_commissions ac
JOIN public.habitus_profiles p ON p.id = ac.ambassador_profile_id
GROUP BY ac.ambassador_profile_id, p.display_name, p.email;

-- RLS: Solo admin y el embajador pueden ver sus comisiones
ALTER TABLE public.habitus_ambassador_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ambassador_commissions_select ON public.habitus_ambassador_commissions
  FOR SELECT TO authenticated
  USING (
    ambassador_profile_id = auth.uid()
    OR public.habitus_is_admin()
  );

CREATE POLICY ambassador_commissions_insert ON public.habitus_ambassador_commissions
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_is_admin());

CREATE POLICY ambassador_commissions_update ON public.habitus_ambassador_commissions
  FOR UPDATE TO authenticated
  USING (public.habitus_is_admin())
  WITH CHECK (public.habitus_is_admin());

-- Función para crear comisión manual (para admin)
CREATE OR REPLACE FUNCTION public.create_ambassador_commission(
  p_ambassador_id uuid,
  p_referred_id uuid,
  p_amount numeric,
  p_commission_type text DEFAULT 'manual',
  p_notes text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_id uuid;
BEGIN
  INSERT INTO public.habitus_ambassador_commissions (
    ambassador_profile_id,
    referred_profile_id,
    commission_type,
    amount,
    event_date,
    notes
  ) VALUES (
    p_ambassador_id,
    p_referred_id,
    p_commission_type,
    p_amount,
    now(),
    p_notes
  )
  RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$$;

-- Función para aprobar comisión
CREATE OR REPLACE FUNCTION public.approve_ambassador_commission(
  p_commission_id uuid,
  p_admin_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.habitus_ambassador_commissions
  SET
    status = 'approved',
    approved_by = p_admin_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_commission_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Función para marcar comisión como pagada
CREATE OR REPLACE FUNCTION public.mark_commission_paid(
  p_commission_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.habitus_ambassador_commissions
  SET
    status = 'paid',
    paid_at = now(),
    updated_at = now()
  WHERE id = p_commission_id AND status = 'approved';

  RETURN FOUND;
END;
$$;

-- Comentarios
COMMENT ON TABLE public.habitus_ambassador_commissions IS 'Comisiones para embajadores (influencers) por referidos convertidos';
COMMENT ON COLUMN public.habitus_ambassador_commissions.commission_type IS 'premium_conversion: usuario se hizo premium, contract_payment: usuario pagó contrato, manual: asignado manualmente';
COMMENT ON COLUMN public.habitus_ambassador_commissions.conversion_date IS 'Fecha en que el referido se convirtió (al menos 2 meses después del registro)';
COMMENT ON VIEW public.ambassador_commission_stats IS 'Estadísticas de comisiones por embajador para panel de admin';
