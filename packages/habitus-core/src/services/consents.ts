import { getSupabase } from "../client";

export type ConsentDocType = "privacy" | "terms" | "cookies";

const CURRENT_VERSION = "2026-05-21";

export async function recordConsent(
  profileId: string,
  docType: ConsentDocType,
): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_consents").insert({
    profile_id: profileId,
    doc_type: docType,
    doc_version: CURRENT_VERSION,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  return error?.message ?? null;
}

export async function recordSignupConsents(profileId: string): Promise<string | null> {
  for (const docType of ["privacy", "terms"] as ConsentDocType[]) {
    const err = await recordConsent(profileId, docType);
    if (err) return err;
  }
  return null;
}

export async function hasConsent(profileId: string, docType: ConsentDocType): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("habitus_consents")
    .select("id")
    .eq("profile_id", profileId)
    .eq("doc_type", docType)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
