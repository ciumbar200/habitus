import { getSupabase } from "../client";
import { buildReferralUrl } from "../lib/share";

export type ReferralStats = {
  referralCode: string | null;
  qualifiedCount: number;
  goal: number;
};

export const REFERRAL_GOAL = 5;

export async function getOrCreateReferralCode(profileId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_get_or_create_referral_code", {
    p_profile_id: profileId,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function recordReferral(referrerCode: string, referredId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_record_referral", {
    p_referrer_code: referrerCode,
    p_referred_id: referredId,
  });
  if (error) return error.message;
  return (data as string | null) ?? null;
}

export async function fetchReferralStats(profileId: string): Promise<ReferralStats> {
  const { data, error } = await getSupabase().rpc("habitus_referral_stats", {
    p_profile_id: profileId,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    referralCode: (row.referralCode as string | null) ?? null,
    qualifiedCount: Number(row.qualifiedCount ?? 0),
    goal: Number(row.goal ?? REFERRAL_GOAL),
  };
}

export async function buildReferralLinkForProfile(
  profileId: string,
  siteOrigin?: string,
): Promise<{ code: string; url: string } | null> {
  const code = await getOrCreateReferralCode(profileId);
  if (!code) return null;
  return { code, url: buildReferralUrl(code, siteOrigin) };
}

export type ReferredUser = {
  referredId: string;
  displayName: string;
  accountRole: string | null;
  joinedAt: string;
  status: string;
};

export async function fetchAmbassadorReferrals(profileId: string): Promise<ReferredUser[]> {
  const { data, error } = await getSupabase()
    .from("habitus_referrals")
    .select("referred_id, status, created_at, habitus_profiles!referred_id(display_name, account_role)")
    .eq("referrer_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = row.habitus_profiles as { display_name?: string; account_role?: string | null } | null;
    return {
      referredId: row.referred_id,
      displayName: profile?.display_name ?? "—",
      accountRole: profile?.account_role ?? null,
      joinedAt: row.created_at,
      status: row.status,
    };
  });
}
