import { getSupabase } from "../client";
import { buildProfileSlug } from "../lib/profileSlug";
import type { CompatQuizAnswers } from "../types/compatibility";
import type { AccountRoleSlug } from "../types/models";
import {
  EMPTY_SEARCH_PREFS,
  normalizeSearchPrefs,
  type SearchPrefs,
} from "../types/searchPrefs";

export type ProfileUpdateInput = {
  displayName: string;
  roleTitle: string | null;
  bioQuote: string | null;
  avatarUrl: string | null;
  isDiscoverable?: boolean;
  searchPrefs?: SearchPrefs;
  tags?: string[];
};

export type ProfileEditData = {
  displayName: string;
  roleTitle: string | null;
  bioQuote: string | null;
  avatarUrl: string | null;
  isDiscoverable: boolean;
  birthDate: string | null;
  profileScore: number;
  searchPrefs: SearchPrefs;
  tags: string[];
  compatQuiz: CompatQuizAnswers;
  accountRole: AccountRoleSlug | null;
};

export function computeProfileScore(
  input: ProfileUpdateInput,
  role?: AccountRoleSlug | null,
): number {
  let score = 15;
  if (input.displayName.trim().length >= 2) score += 20;
  if (input.avatarUrl) score += 30;
  if ((input.bioQuote?.trim().length ?? 0) >= 30) score += 20;
  if (input.roleTitle?.trim()) score += 10;

  const isPublisher = role === "propietario" || role === "agencia";
  if (!isPublisher) {
    if ((input.tags?.length ?? 0) >= 2) score += 5;
    const prefs = input.searchPrefs;
    if (prefs?.city) score += 5;
    if (prefs?.budgetMax && prefs.budgetMax > 0) score += 5;
  }

  return Math.min(100, score);
}

export async function fetchProfileTags(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profile_tags")
    .select("tag")
    .eq("profile_id", userId);

  if (error) return [];
  return (data ?? []).map((r) => r.tag);
}

export async function fetchProfileDetails(userId: string) {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, display_name, avatar_url, profile_score, role_title, account_role, bio_quote, is_discoverable, birth_date, onboarding_completed_at, search_prefs, compat_quiz",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchProfileEditData(userId: string): Promise<ProfileEditData | null> {
  const [profile, tags] = await Promise.all([
    fetchProfileDetails(userId),
    fetchProfileTags(userId),
  ]);
  if (!profile) return null;

  const rawQuiz = profile.compat_quiz;
  const compatQuiz =
    rawQuiz && typeof rawQuiz === "object" && !Array.isArray(rawQuiz)
      ? (rawQuiz as CompatQuizAnswers)
      : {};

  return {
    displayName: profile.display_name,
    roleTitle: profile.role_title,
    bioQuote: profile.bio_quote,
    avatarUrl: profile.avatar_url,
    isDiscoverable: profile.is_discoverable ?? false,
    birthDate: profile.birth_date,
    profileScore: profile.profile_score ?? 0,
    searchPrefs: normalizeSearchPrefs(profile.search_prefs),
    tags,
    compatQuiz,
    accountRole: (profile.account_role as AccountRoleSlug | null) ?? null,
  };
}

export async function fetchSearchPrefs(userId: string): Promise<SearchPrefs> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select("search_prefs")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return { ...EMPTY_SEARCH_PREFS };
  return normalizeSearchPrefs(data.search_prefs);
}

async function saveProfileTags(userId: string, tags: string[]): Promise<string | null> {
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
  const { error: delErr } = await getSupabase()
    .from("habitus_profile_tags")
    .delete()
    .eq("profile_id", userId);
  if (delErr) return delErr.message;

  if (unique.length === 0) return null;

  const { error: insErr } = await getSupabase()
    .from("habitus_profile_tags")
    .insert(unique.map((tag) => ({ profile_id: userId, tag })));
  if (insErr) return insErr.message;
  return null;
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
  accountRole: AccountRoleSlug | null,
): Promise<{ error: string | null }> {
  const score = computeProfileScore(input, accountRole);
  const isDiscoverable =
    input.isDiscoverable ?? (accountRole === "inquilino");

  const { data: existingSlug } = await getSupabase()
    .from("habitus_profiles")
    .select("slug")
    .eq("id", userId)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    display_name: input.displayName.trim(),
    role_title: input.roleTitle?.trim() || null,
    bio_quote: input.bioQuote?.trim() || null,
    avatar_url: input.avatarUrl,
    profile_score: score,
    is_discoverable: isDiscoverable,
    updated_at: new Date().toISOString(),
  };

  if (!existingSlug?.slug?.trim()) {
    payload.slug = buildProfileSlug(input.displayName.trim(), userId);
  }

  if (input.searchPrefs !== undefined) {
    payload.search_prefs = input.searchPrefs;
  }

  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update(payload)
    .eq("id", userId);

  if (error) return { error: error.message };

  if (input.tags !== undefined) {
    const tagErr = await saveProfileTags(userId, input.tags);
    if (tagErr) return { error: tagErr };
  }

  await getSupabase().auth.updateUser({
    data: { full_name: input.displayName.trim() },
  });

  return { error: null };
}

export type OnboardingInput = {
  displayName: string;
  birthDate: string;
};

export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
): Promise<{ error: string | null }> {
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return { error: "Indica tu nombre completo." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    return { error: "Indica una fecha de nacimiento válida." };
  }

  const { data: before } = await getSupabase()
    .from("habitus_profiles")
    .select("slug")
    .eq("id", userId)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    display_name: displayName,
    birth_date: input.birthDate,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!before?.slug?.trim()) {
    payload.slug = buildProfileSlug(displayName, userId);
  }

  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update(payload)
    .eq("id", userId);

  if (error) return { error: error.message };

  await getSupabase().auth.updateUser({
    data: { full_name: displayName, birth_date: input.birthDate },
  });

  return { error: null };
}

export async function requestIdentityVerification(userId: string): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({
      identity_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

/** Demo: simula verificación Veriff completada. */
export async function completeIdentityVerificationDemo(
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({
      identity_status: "verified",
      identity_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

/** Elimina la cuenta del usuario autenticado (requisito App Store). */
export async function deleteOwnAccount(): Promise<{ error: string | null }> {
  const { error } = await getSupabase().rpc("habitus_delete_own_account");
  return { error: error?.message ?? null };
}
