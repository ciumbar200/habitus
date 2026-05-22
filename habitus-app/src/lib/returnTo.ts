import { isAuthFunnelStep, isValidReturnPath, postAuthRedirectPath } from "@habitus/core";
import type { CompatQuizAnswers, Profile } from "@habitus/core";

const STORAGE_KEY = "habitus_return_to";

export function saveReturnTo(path: string): void {
  if (typeof sessionStorage === "undefined") return;
  if (isValidReturnPath(path)) sessionStorage.setItem(STORAGE_KEY, path);
}

export function peekReturnTo(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const v = sessionStorage.getItem(STORAGE_KEY);
  return v && isValidReturnPath(v) ? v : null;
}

export function consumeReturnTo(): string | null {
  const v = peekReturnTo();
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
  return v;
}

/** Destino tras login/registro/OAuth; consume returnTo solo si ya no hay pasos pendientes. */
export function redirectAfterAuth(profile: Profile | null, quiz: CompatQuizAnswers = {}): string {
  const pending = peekReturnTo();
  const path = postAuthRedirectPath(profile, quiz, pending);
  if (!isAuthFunnelStep(path)) consumeReturnTo();
  return path;
}
