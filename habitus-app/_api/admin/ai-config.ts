import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate, bodyOf } from "../_lib/verification.js";
import { clearAiRuntimeCache } from "../_lib/aiRuntime.js";

const CONFIG_KEY = "ai_platform_settings";

const DEFAULTS = {
  gatewayBaseUrl: "https://ai-gateway.vercel.sh/v1",
  defaultModel: "openai/gpt-4o-mini",
  matchModel: "openai/gpt-4o-mini",
  safetyModel: "openai/gpt-4o-mini",
  visionModel: "openai/gpt-4o-mini",
};

function maskConfig(value: Record<string, unknown>) {
  const apiKey = typeof value.apiKey === "string" ? value.apiKey : "";
  const envKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim());
  return {
    gatewayBaseUrl:
      typeof value.gatewayBaseUrl === "string" ? value.gatewayBaseUrl : DEFAULTS.gatewayBaseUrl,
    defaultModel: typeof value.defaultModel === "string" ? value.defaultModel : DEFAULTS.defaultModel,
    matchModel: typeof value.matchModel === "string" ? value.matchModel : DEFAULTS.matchModel,
    safetyModel: typeof value.safetyModel === "string" ? value.safetyModel : DEFAULTS.safetyModel,
    visionModel: typeof value.visionModel === "string" ? value.visionModel : DEFAULTS.visionModel,
    apiKeyConfigured: Boolean(apiKey) || envKey,
    apiKeySource: apiKey ? "database" : envKey ? "environment" : "none",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const auth = await authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }
  if (!auth.isAdmin) {
    res.status(403).json({ error: "Acceso solo para administradores." });
    return;
  }

  if (req.method === "GET") {
    const { data } = await auth.adminClient
      .from("habitus_platform_config")
      .select("value, updated_at")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    const value =
      data?.value && typeof data.value === "object"
        ? (data.value as Record<string, unknown>)
        : DEFAULTS;

    res.status(200).json({
      config: maskConfig(value),
      updatedAt: data?.updated_at ?? null,
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  const body = bodyOf(req);
  const { data: existing } = await auth.adminClient
    .from("habitus_platform_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  const prev =
    existing?.value && typeof existing.value === "object"
      ? (existing.value as Record<string, unknown>)
      : { ...DEFAULTS };

  const next: Record<string, unknown> = { ...prev };

  for (const key of [
    "gatewayBaseUrl",
    "defaultModel",
    "matchModel",
    "safetyModel",
    "visionModel",
  ] as const) {
    if (typeof body[key] === "string" && body[key].trim()) {
      next[key] = String(body[key]).trim();
    }
  }

  if (body.clearApiKey === true) {
    delete next.apiKey;
  } else if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    next.apiKey = body.apiKey.trim();
  }

  if (typeof next.gatewayBaseUrl === "string") {
    next.gatewayBaseUrl = next.gatewayBaseUrl.replace(/\/$/, "");
  }

  const { error } = await auth.adminClient.from("habitus_platform_config").upsert({
    key: CONFIG_KEY,
    value: next,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  clearAiRuntimeCache();
  res.status(200).json({ config: maskConfig(next), saved: true });
}
