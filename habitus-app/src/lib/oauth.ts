import type { OAuthProvider } from "@habitus/core";
import { toSupabaseProvider } from "@habitus/core";
import { supabase } from "./supabase";

export const PENDING_OAUTH_ROLE_KEY = "habitus_pending_oauth_role";
export const PENDING_OAUTH_SIGNUP_KEY = "habitus_pending_oauth_signup";

export function oauthRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: { isSignUp?: boolean; accountRole?: string },
): Promise<{ error: string | null }> {
  if (options?.isSignUp) {
    sessionStorage.setItem(PENDING_OAUTH_SIGNUP_KEY, "1");
    if (options.accountRole) {
      sessionStorage.setItem(PENDING_OAUTH_ROLE_KEY, options.accountRole);
    } else {
      sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    }
  } else {
    sessionStorage.removeItem(PENDING_OAUTH_SIGNUP_KEY);
    sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(provider),
    options: {
      redirectTo: oauthRedirectUrl(),
      queryParams: {
        access_type: "offline",
        prompt: options?.isSignUp ? "consent" : "select_account",
      },
    },
  });

  return { error: error?.message ?? null };
}

export function consumePendingOAuthSignup(): {
  isSignUp: boolean;
  accountRole: string | null;
} {
  const isSignUp = sessionStorage.getItem(PENDING_OAUTH_SIGNUP_KEY) === "1";
  const accountRole = sessionStorage.getItem(PENDING_OAUTH_ROLE_KEY);
  sessionStorage.removeItem(PENDING_OAUTH_SIGNUP_KEY);
  sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
  return { isSignUp, accountRole };
}
