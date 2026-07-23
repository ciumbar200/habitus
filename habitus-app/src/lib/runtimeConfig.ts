export type PublicRuntimeConfig = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SITE_URL?: string;
  VITE_GA4_ID?: string;
  VITE_ONESIGNAL_APP_ID?: string;
  VITE_SENTRY_DSN?: string;
  VITE_SENTRY_ENVIRONMENT?: string;
  VITE_SENTRY_RELEASE?: string;
  VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
};

declare global {
  interface Window {
    __MOON_CONFIG__?: PublicRuntimeConfig;
  }
}

export function publicEnv(name: keyof PublicRuntimeConfig): string | undefined {
  const runtimeValue =
    typeof window !== "undefined" ? window.__MOON_CONFIG__?.[name]?.trim() : undefined;
  if (runtimeValue) return runtimeValue;

  const buildValue = (import.meta.env as Record<string, string | undefined>)[name]?.trim();
  return buildValue || undefined;
}
