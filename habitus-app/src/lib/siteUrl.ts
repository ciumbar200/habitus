import { publicEnv } from "./runtimeConfig";

/** Origen canónico (evita perder PKCE entre www y apex). */
export function siteOrigin(): string {
  const fromEnv = publicEnv("VITE_SITE_URL");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function authCallbackUrl(): string {
  return `${siteOrigin()}/auth/callback`;
}
