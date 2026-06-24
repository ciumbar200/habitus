import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate, bodyOf } from "../_lib/verification.js";
import {
  clearIntegrationCache,
  getVerificationIntegrationConfig,
  maskIntegrationConfig,
} from "../_lib/integrationRuntime.js";

const CONFIG_KEY = "verification_integration_settings";

const AI_KEY = "ai_platform_settings";

import type { ServerAuth } from "../_lib/auth.js";

async function aiStatus(auth: ServerAuth) {
  const { data } = await auth.adminClient
    .from("habitus_platform_config")
    .select("value")
    .eq("key", AI_KEY)
    .maybeSingle();
  const value = data?.value && typeof data.value === "object" ? (data.value as Record<string, unknown>) : {};
  const dbKey = typeof value.apiKey === "string" && value.apiKey.trim();
  const envKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim());
  return {
    configured: Boolean(dbKey) || envKey,
    source: dbKey ? "database" : envKey ? "environment" : "none",
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
    const secrets = await getVerificationIntegrationConfig();
    const { data } = await auth.adminClient
      .from("habitus_platform_config")
      .select("value, updated_at")
      .eq("key", CONFIG_KEY)
      .maybeSingle();
    const stored =
      data?.value && typeof data.value === "object" ? (data.value as Record<string, unknown>) : {};

    const ai = await aiStatus(auth);

    res.status(200).json({
      stripe: maskIntegrationConfig(secrets, stored),
      ai,
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
      : {};

  const next: Record<string, unknown> = { ...prev };

  if (typeof body.stripeIdentitySuccessUrl === "string") {
    next.stripeIdentitySuccessUrl = body.stripeIdentitySuccessUrl.trim();
  }
  if (typeof body.retentionDays === "number" && body.retentionDays > 0) {
    next.retentionDays = body.retentionDays;
  }

  if (body.clearStripeSecret === true) delete next.stripeSecretKey;
  else if (typeof body.stripeSecretKey === "string" && body.stripeSecretKey.trim()) {
    next.stripeSecretKey = body.stripeSecretKey.trim();
  }

  if (body.clearWebhookSecret === true) delete next.stripeWebhookSecret;
  else if (typeof body.stripeWebhookSecret === "string" && body.stripeWebhookSecret.trim()) {
    next.stripeWebhookSecret = body.stripeWebhookSecret.trim();
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

  clearIntegrationCache();
  const secrets = await getVerificationIntegrationConfig();
  res.status(200).json({
    stripe: maskIntegrationConfig(secrets, next),
    saved: true,
  });
}
