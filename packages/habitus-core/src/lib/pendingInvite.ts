export const PENDING_GROUP_SLUG_KEY = "habitus_pending_group_slug";
export const PENDING_REFERRAL_KEY = "habitus_pending_referral";

export function persistPendingGroupSlug(slug: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PENDING_GROUP_SLUG_KEY, slug);
}

export function consumePendingGroupSlug(): string | null {
  if (typeof localStorage === "undefined") return null;
  const slug = localStorage.getItem(PENDING_GROUP_SLUG_KEY);
  if (slug) localStorage.removeItem(PENDING_GROUP_SLUG_KEY);
  return slug;
}

export function persistPendingReferral(code: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PENDING_REFERRAL_KEY, code.trim().toLowerCase());
}

export function peekPendingReferral(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PENDING_REFERRAL_KEY);
}

export function consumePendingReferral(): string | null {
  if (typeof localStorage === "undefined") return null;
  const code = localStorage.getItem(PENDING_REFERRAL_KEY);
  if (code) localStorage.removeItem(PENDING_REFERRAL_KEY);
  return code;
}

export function peekPendingGroupSlug(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PENDING_GROUP_SLUG_KEY);
}

export function parseReferralCode(searchParams: URLSearchParams): string | null {
  const ref = searchParams.get("ref")?.trim();
  return ref && ref.length > 0 ? ref : null;
}

export function parseGroupSlugParam(searchParams: URLSearchParams): string | null {
  const grupo = searchParams.get("grupo")?.trim();
  return grupo && grupo.length > 0 ? grupo : null;
}
