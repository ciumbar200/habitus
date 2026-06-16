import { getSupabase } from "../client";
import type {
  MoonScore,
  MoonScoreTier,
  RoommateEndorsement,
  EndorsementInput,
  IdentityStatus,
} from "../types/models";

/**
 * moon Score — reputacion PORTABLE del conviviente (el moat "LinkedIn del co-living").
 *
 * Distinto de profile_score (que mide COMPLETITUD del perfil), moon_score mide
 * REPUTACION: lo que otros convivientes dijeron tras vivir contigo. Es el unico
 * activo que Idealista/Badi no pueden copiar en meses porque requiere tiempo y
 * masa critica de convivencias reales acumuladas.
 *
 * El source of truth es la columna cacheada moon_score en habitus_profiles
 * (actualizada por trigger desde habitus_roommate_endorsements). computeMoonScore()
 * es el espejo puro en TS de la funcion SQL habitus_compute_moon_score, util para
 * previsualizar el score en cliente sin esperar al trigger.
 */

/** Tramos de presentacion del score (color + etiqueta en UI). */
export function moonScoreTier(score: number, endorsements: number): MoonScoreTier {
  if (endorsements <= 0) return "new";
  if (score >= 80) return "excellent";
  if (score >= 55) return "good";
  return "building";
}

/**
 * Espejo TS puro del calculo SQL (habitus_compute_moon_score).
 * Entrada:
 *  - identityStatus / verificationBadge: senal de identidad verificada
 *  - endorsements: nº de endosos validos
 *  - avgRating01: rating medio 0..1 sobre las 4 dimensiones (cada dim 1..5)
 */
export function computeMoonScore(signals: {
  identityStatus: IdentityStatus;
  verificationBadge?: "none" | "basic_trust" | "identity_verified";
  endorsements: number;
  avgRating01: number;
}): number {
  const identity =
    signals.verificationBadge === "identity_verified" || signals.identityStatus === "verified"
      ? 20
      : signals.verificationBadge === "basic_trust" || signals.identityStatus === "basic_trust"
        ? 10
        : 0;
  const social = Math.min(signals.endorsements, 5) * 12; // +12 por endoso, tope +60
  const rating = Math.round((signals.avgRating01 || 0) * 20); // tope +20
  return Math.max(0, Math.min(100, identity + social + rating));
}

type MoonScoreRow = { moon_score: number | null; moon_score_endorsements: number | null };

/** Lee el Moon Score cacheado de un perfil. null si no existe o error. */
export async function fetchMoonScore(profileId: string): Promise<MoonScore | null> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select("moon_score, moon_score_endorsements")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as MoonScoreRow;
  const score = row.moon_score ?? 0;
  const endorsements = row.moon_score_endorsements ?? 0;
  return {
    score,
    endorsements,
    tier: moonScoreTier(score, endorsements),
    live: endorsements > 0,
  };
}

type EndorsementRow = {
  id: string;
  endorser_id: string;
  endorsee_id: string;
  cleanliness: number;
  respect: number;
  communication: number;
  payment: number;
  would_live_again: boolean;
  comment: string | null;
  created_at: string;
};

/** Endosos recibidos por un perfil (solo visibles para el propio perfil / admin por RLS). */
export async function fetchEndorsementsReceived(
  profileId: string,
): Promise<RoommateEndorsement[]> {
  const { data, error } = await getSupabase()
    .from("habitus_roommate_endorsements")
    .select(
      "id, endorser_id, endorsee_id, cleanliness, respect, communication, payment, would_live_again, comment, created_at",
    )
    .eq("endorsee_id", profileId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as EndorsementRow[]).map((r) => ({
    id: r.id,
    endorserId: r.endorser_id,
    endorseeId: r.endorsee_id,
    cleanliness: r.cleanliness,
    respect: r.respect,
    communication: r.communication,
    payment: r.payment,
    wouldLiveAgain: r.would_live_again,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

/** Crea un endoso. El endorser_id lo pone el caller (debe ser auth.uid(); RLS lo exige). */
export async function submitEndorsement(
  endorserId: string,
  input: EndorsementInput,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_roommate_endorsements")
    .insert({
      endorser_id: endorserId,
      endorsee_id: input.endorseeId,
      convivencia_ref: input.convivenciaRef ?? null,
      cleanliness: input.cleanliness,
      respect: input.respect,
      communication: input.communication,
      payment: input.payment,
      would_live_again: input.wouldLiveAgain,
      comment: input.comment ?? null,
    });
  return { error: error ? error.message : null };
}

/** ¿Ya endosó este endorser a este conviviente? (para deshabilitar doble endoso en UI). */
export async function hasEndorsed(
  endorserId: string,
  endorseeId: string,
): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("habitus_roommate_endorsements")
    .select("id")
    .eq("endorser_id", endorserId)
    .eq("endorsee_id", endorseeId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
