import type { SupabaseClient } from "@supabase/supabase-js";

export type AiRuntimeOverrides = {
  gatewayBaseUrl: string;
  defaultModel: string;
  matchModel: string;
  safetyModel: string;
  visionModel: string;
  apiKey?: string;
};

const DEFAULTS: AiRuntimeOverrides = {
  gatewayBaseUrl: "https://ai-gateway.vercel.sh/v1",
  defaultModel: "openai/gpt-4o-mini",
  matchModel: "openai/gpt-4o-mini",
  safetyModel: "openai/gpt-4o-mini",
  visionModel: "openai/gpt-4o-mini",
};

const CONFIG_KEY = "ai_platform_settings";

function normalize(raw: unknown): AiRuntimeOverrides {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const apiKey = typeof o.apiKey === "string" ? o.apiKey.trim() : undefined;
  return {
    gatewayBaseUrl:
      typeof o.gatewayBaseUrl === "string" && o.gatewayBaseUrl.trim()
        ? o.gatewayBaseUrl.trim().replace(/\/$/, "")
        : DEFAULTS.gatewayBaseUrl,
    defaultModel:
      typeof o.defaultModel === "string" && o.defaultModel.trim()
        ? o.defaultModel.trim()
        : DEFAULTS.defaultModel,
    matchModel:
      typeof o.matchModel === "string" && o.matchModel.trim()
        ? o.matchModel.trim()
        : DEFAULTS.matchModel,
    safetyModel:
      typeof o.safetyModel === "string" && o.safetyModel.trim()
        ? o.safetyModel.trim()
        : DEFAULTS.safetyModel,
    visionModel:
      typeof o.visionModel === "string" && o.visionModel.trim()
        ? o.visionModel.trim()
        : DEFAULTS.visionModel,
    ...(apiKey ? { apiKey } : {}),
  };
}

let cache: { at: number; value: AiRuntimeOverrides } | null = null;
const TTL_MS = 60_000;

export async function loadAiRuntimeOverrides(
  admin: SupabaseClient,
): Promise<AiRuntimeOverrides> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const { data } = await admin
    .from("habitus_platform_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  const value = normalize(data?.value);
  cache = { at: Date.now(), value };
  return value;
}

export function clearAiRuntimeCache(): void {
  cache = null;
}
