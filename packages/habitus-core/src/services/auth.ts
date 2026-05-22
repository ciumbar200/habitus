import type { Provider, User } from "@supabase/supabase-js";
import { getSupabase } from "../client";
import { buildProfileSlug } from "../lib/profileSlug";
import { isQuizComplete } from "./compatibility";
import type { CompatQuizAnswers } from "../types/compatibility";
import { isValidReturnPath } from "../lib/returnTo";
import {
  profileNeedsOnboarding,
  profileNeedsCompatQuiz,
} from "../lib/onboarding";
import { homePathForRole } from "../config/roleNavigation";
import type { AccountRoleSlug, Profile } from "../types/models";

export type OAuthProvider = "google" | "facebook";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "facebook"];

export function toSupabaseProvider(provider: OAuthProvider): Provider {
  return provider;
}

export function displayNameFromAuthUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw =
    meta.full_name ??
    meta.name ??
    (meta.given_name && meta.family_name
      ? `${meta.given_name} ${meta.family_name}`
      : null) ??
    user.email?.split("@")[0] ??
    "Usuario";
  return String(raw).trim();
}

export function avatarFromAuthUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture ?? null;
  return typeof url === "string" ? url : null;
}

export async function ensureProfileForAuthUser(
  user: User,
  accountRole?: AccountRoleSlug | null,
): Promise<{ error: string | null }> {
  const { data: existing, error: readErr } = await getSupabase()
    .from("habitus_profiles")
    .select("id, display_name, account_role, avatar_url, slug")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) return { error: readErr.message };

  const name = displayNameFromAuthUser(user);
  const avatar = avatarFromAuthUser(user);
  const role = accountRole ?? (existing?.account_role as AccountRoleSlug | null) ?? null;

  if (!existing) {
    const slug = buildProfileSlug(name, user.id);
    const { error } = await getSupabase().from("habitus_profiles").insert({
      id: user.id,
      display_name: name,
      avatar_url: avatar,
      account_role: role,
      is_discoverable: role === "inquilino",
      profile_score: avatar ? 45 : 35,
      slug,
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (!existing.display_name?.trim() && name) updates.display_name = name;
  if (!existing.avatar_url && avatar) updates.avatar_url = avatar;
  if (accountRole && !existing.account_role) {
    updates.account_role = accountRole;
    updates.is_discoverable = accountRole === "inquilino";
  }

  if (!existing.slug?.trim()) {
    updates.slug = buildProfileSlug(existing.display_name?.trim() || name, user.id);
  }

  if (Object.keys(updates).length > 1) {
    const { error } = await getSupabase()
      .from("habitus_profiles")
      .update(updates)
      .eq("id", user.id);
    if (error) return { error: error.message };
  }

  if (accountRole) {
    await getSupabase().auth.updateUser({
      data: { account_role: accountRole, full_name: name },
    });
  }

  return { error: null };
}

export function postAuthRedirectPath(
  profile: Profile | null,
  quizAnswers: CompatQuizAnswers = {},
  returnTo?: string | null,
): string {
  if (!profile?.accountRole) return "/completar-rol";
  if (profile.isAdmin) {
    if (returnTo && isValidReturnPath(returnTo)) return returnTo;
    return "/admin";
  }
  if (profileNeedsOnboarding(profile)) return "/onboarding";
  if (
    profileNeedsCompatQuiz(profile) &&
    !isQuizComplete(quizAnswers, profile.accountRole)
  ) {
    return "/cuestionario-compatibilidad";
  }
  if (returnTo && isValidReturnPath(returnTo)) return returnTo;
  return homePathForRole(profile.accountRole);
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  return { error: error?.message ?? null };
}
