/** Origen canónico (evita perder PKCE entre www y apex). */
export function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function authCallbackUrl(): string {
  return `${siteOrigin()}/auth/callback`;
}
