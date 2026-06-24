import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../client";

const CONFIG_KEY = "ai_platform_settings";

export type PlatformAiConfig = {
  gatewayBaseUrl: string;
  defaultModel: string;
  matchModel: string;
  safetyModel: string;
  visionModel: string;
};

export const DEFAULT_PLATFORM_AI_CONFIG: PlatformAiConfig = {
  gatewayBaseUrl: "https://ai-gateway.vercel.sh/v1",
  defaultModel: "openai/gpt-4o-mini",
  matchModel: "openai/gpt-4o-mini",
  safetyModel: "openai/gpt-4o-mini",
  visionModel: "openai/gpt-4o-mini",
};

type StoredAiSettings = PlatformAiConfig & { apiKey?: string };

function normalize(raw: unknown): PlatformAiConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    gatewayBaseUrl:
      typeof o.gatewayBaseUrl === "string" && o.gatewayBaseUrl.trim()
        ? o.gatewayBaseUrl.trim().replace(/\/$/, "")
        : DEFAULT_PLATFORM_AI_CONFIG.gatewayBaseUrl,
    defaultModel:
      typeof o.defaultModel === "string" && o.defaultModel.trim()
        ? o.defaultModel.trim()
        : DEFAULT_PLATFORM_AI_CONFIG.defaultModel,
    matchModel:
      typeof o.matchModel === "string" && o.matchModel.trim()
        ? o.matchModel.trim()
        : DEFAULT_PLATFORM_AI_CONFIG.matchModel,
    safetyModel:
      typeof o.safetyModel === "string" && o.safetyModel.trim()
        ? o.safetyModel.trim()
        : DEFAULT_PLATFORM_AI_CONFIG.safetyModel,
    visionModel:
      typeof o.visionModel === "string" && o.visionModel.trim()
        ? o.visionModel.trim()
        : DEFAULT_PLATFORM_AI_CONFIG.visionModel,
  };
}

export async function fetchPlatformAiConfig(): Promise<PlatformAiConfig> {
  try {
    const { data, error } = await getSupabase()
      .from("habitus_platform_config")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();
    if (error || !data?.value) return DEFAULT_PLATFORM_AI_CONFIG;
    return normalize(data.value);
  } catch {
    return DEFAULT_PLATFORM_AI_CONFIG;
  }
}

/** Solo servidor: incluye apiKey almacenada en BD (admin). */
export async function fetchPlatformAiConfigWithSecret(admin: SupabaseClient): Promise<StoredAiSettings> {
  const { data } = await admin
    .from("habitus_platform_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();
  const base = normalize(data?.value);
  const apiKey =
    data?.value && typeof data.value === "object" && typeof (data.value as StoredAiSettings).apiKey === "string"
      ? (data.value as StoredAiSettings).apiKey!.trim()
      : undefined;
  return apiKey ? { ...base, apiKey } : base;
}

export async function adminUpdatePlatformAiConfig(
  partial: Partial<PlatformAiConfig> & { apiKey?: string | null },
): Promise<string | null> {
  const current = await fetchPlatformAiConfig();
  const { data: existing } = await getSupabase()
    .from("habitus_platform_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  const prev: Partial<StoredAiSettings> =
    existing?.value && typeof existing.value === "object"
      ? (existing.value as StoredAiSettings)
      : {};

  const { apiKey: partialApiKey, ...partialModels } = partial;
  const next: StoredAiSettings = {
    ...current,
    ...partialModels,
    gatewayBaseUrl: partial.gatewayBaseUrl?.trim().replace(/\/$/, "") ?? current.gatewayBaseUrl,
  };

  if (partialApiKey === null) {
    delete next.apiKey;
  } else if (typeof partialApiKey === "string" && partialApiKey.trim()) {
    next.apiKey = partialApiKey.trim();
  } else if (prev.apiKey) {
    next.apiKey = prev.apiKey;
  }

  const { error } = await getSupabase()
    .from("habitus_platform_config")
    .upsert({
      key: CONFIG_KEY,
      value: next as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    });
  return error?.message ?? null;
}
