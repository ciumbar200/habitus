import AsyncStorage from "@react-native-async-storage/async-storage";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { es, toSupabaseProvider, type OAuthProvider } from "@habitus/core";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export const PENDING_OAUTH_ROLE_KEY = "habitus_pending_oauth_role";
export const PENDING_OAUTH_SIGNUP_KEY = "habitus_pending_oauth_signup";

export function oauthRedirectUri(): string {
  return makeRedirectUri({ scheme: "habitus", path: "auth/callback" });
}

export async function signInWithOAuthMobile(
  provider: OAuthProvider,
  options?: { isSignUp?: boolean; accountRole?: string },
): Promise<{ error: string | null; cancelled?: boolean }> {
  if (options?.isSignUp) {
    await AsyncStorage.setItem(PENDING_OAUTH_SIGNUP_KEY, "1");
    if (options.accountRole) {
      await AsyncStorage.setItem(PENDING_OAUTH_ROLE_KEY, options.accountRole);
    } else {
      await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    }
  } else {
    await AsyncStorage.multiRemove([PENDING_OAUTH_SIGNUP_KEY, PENDING_OAUTH_ROLE_KEY]);
  }

  const redirectTo = oauthRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(provider),
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) return { error: error.message };
  if (!data?.url) return { error: es.access.oauthError };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "cancel" || result.type === "dismiss") {
    return { error: null, cancelled: true };
  }
  if (result.type !== "success" || !result.url) {
    return { error: es.access.oauthError };
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) return { error: errorCode };

  const code = params.code;
  if (!code) return { error: es.access.oauthError };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: exchangeError?.message ?? null };
}

export async function consumePendingOAuthSignup(): Promise<{
  isSignUp: boolean;
  accountRole: string | null;
}> {
  const isSignUp = (await AsyncStorage.getItem(PENDING_OAUTH_SIGNUP_KEY)) === "1";
  const accountRole = await AsyncStorage.getItem(PENDING_OAUTH_ROLE_KEY);
  await AsyncStorage.multiRemove([PENDING_OAUTH_SIGNUP_KEY, PENDING_OAUTH_ROLE_KEY]);
  return { isSignUp, accountRole };
}
