import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAuthFunnelStep, isValidReturnPath, postAuthRedirectPath } from "@habitus/core";
import type { CompatQuizAnswers, Profile } from "@habitus/core";

const STORAGE_KEY = "habitus_return_to";

export async function saveReturnTo(path: string): Promise<void> {
  if (isValidReturnPath(path)) await AsyncStorage.setItem(STORAGE_KEY, path);
}

export async function peekReturnTo(): Promise<string | null> {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  return v && isValidReturnPath(v) ? v : null;
}

export async function consumeReturnTo(): Promise<string | null> {
  const v = await peekReturnTo();
  await AsyncStorage.removeItem(STORAGE_KEY);
  return v;
}

export async function redirectAfterAuth(
  profile: Profile | null,
  quiz: CompatQuizAnswers = {},
): Promise<string> {
  const pending = await peekReturnTo();
  const path = postAuthRedirectPath(profile, quiz, pending);
  if (!isAuthFunnelStep(path)) await consumeReturnTo();
  return path;
}
