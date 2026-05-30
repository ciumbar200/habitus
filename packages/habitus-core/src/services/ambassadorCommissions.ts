import { getSupabase } from "../client";

/**
 * SISTEMA DE COMISIONES DE EMBAJADORES
 * Los embajadores (influencers) ganan comisiones cuando sus referidos:
 * - Se hacen premium (después de 2 meses)
 * - Pagan contratos de alquiler
 * - Asignación manual por admin
 */

export type AmbassadorCommissionType = "premium_conversion" | "contract_payment" | "manual";
export type CommissionStatus = "pending" | "approved" | "paid" | "rejected";

export type AmbassadorCommission = {
  id: string;
  ambassadorProfileId: string;
  referredProfileId: string;
  commissionType: AmbassadorCommissionType;
  amount: number;
  currency: string;
  status: CommissionStatus;
  eventDate: string;
  conversionDate: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  ambassadorName?: string;
  ambassadorEmail?: string;
  referredName?: string;
  referredEmail?: string;
};

export type AmbassadorCommissionStats = {
  ambassadorProfileId: string;
  ambassadorName: string;
  ambassadorEmail: string;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  totalPaid: number;
  totalApproved: number;
  totalPending: number;
};

/**
 * Obtiene comisiones de un embajador
 */
export async function fetchAmbassadorCommissions(ambassadorId: string): Promise<AmbassadorCommission[]> {
  const { data, error } = await getSupabase()
    .from("habitus_ambassador_commissions")
    .select(`
      *,
      ambassador_profile:habitus_profiles!ambassador_profile_id(display_name, email),
      referred_profile:habitus_profiles!referred_profile_id(display_name, email)
    `)
    .eq("ambassador_profile_id", ambassadorId)
    .order("event_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    ambassadorProfileId: row.ambassador_profile_id,
    referredProfileId: row.referred_profile_id,
    commissionType: row.commission_type,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    eventDate: row.event_date,
    conversionDate: row.conversion_date,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ambassadorName: row.ambassador_profile?.display_name,
    ambassadorEmail: row.ambassador_profile?.email,
    referredName: row.referred_profile?.display_name,
    referredEmail: row.referred_profile?.email,
  }));
}

/**
 * Obtiene todas las comisiones (para admin)
 */
export async function fetchAllAmbassadorCommissions(status?: CommissionStatus): Promise<AmbassadorCommission[]> {
  const query = getSupabase()
    .from("habitus_ambassador_commissions")
    .select(`
      *,
      ambassador_profile:habitus_profiles!ambassador_profile_id(display_name, email),
      referred_profile:habitus_profiles!referred_profile_id(display_name, email)
    `)
    .order("event_date", { ascending: false });

  if (status) {
    query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    ambassadorProfileId: row.ambassador_profile_id,
    referredProfileId: row.referred_profile_id,
    commissionType: row.commission_type,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    eventDate: row.event_date,
    conversionDate: row.conversion_date,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ambassadorName: row.ambassador_profile?.display_name,
    ambassadorEmail: row.ambassador_profile?.email,
    referredName: row.referred_profile?.display_name,
    referredEmail: row.referred_profile?.email,
  }));
}

/**
 * Obtiene estadísticas de comisiones para todos los embajadores (admin)
 */
export async function fetchAmbassadorCommissionStats(): Promise<AmbassadorCommissionStats[]> {
  const { data, error } = await getSupabase()
    .from("ambassador_commission_stats")
    .select("*")
    .order("ambassador_name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ambassadorProfileId: row.ambassador_profile_id,
    ambassadorName: row.ambassador_name,
    ambassadorEmail: row.ambassador_email,
    pendingCount: Number(row.pending_count),
    approvedCount: Number(row.approved_count),
    paidCount: Number(row.paid_count),
    totalPaid: Number(row.total_paid),
    totalApproved: Number(row.total_approved),
    totalPending: Number(row.total_pending),
  }));
}

/**
 * Aprueba una comisión (admin)
 */
export async function approveAmbassadorCommission(commissionId: string): Promise<string | null> {
  const { error } = await getSupabase().rpc("approve_ambassador_commission", {
    p_commission_id: commissionId,
  });

  if (error) return error.message;
  return null;
}

/**
 * Marca una comisión como pagada (admin)
 */
export async function markCommissionPaid(commissionId: string): Promise<string | null> {
  const { error } = await getSupabase().rpc("mark_commission_paid", {
    p_commission_id: commissionId,
  });

  if (error) return error.message;
  return null;
}

/**
 * Crea una comisión manual (admin)
 */
export async function createAmbassadorCommission(
  ambassadorId: string,
  referredId: string,
  amount: number,
  commissionType: AmbassadorCommissionType = "manual",
  notes?: string
): Promise<string | null> {
  const { error } = await getSupabase().rpc("create_ambassador_commission", {
    p_ambassador_id: ambassadorId,
    p_referred_id: referredId,
    p_amount: amount,
    p_commission_type: commissionType,
    p_notes: notes,
  });

  if (error) return error.message;
  return null;
}
