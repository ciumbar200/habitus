import { createClient } from "@supabase/supabase-js";
import { serverConfig } from "./auth.js";

const CONFIG_KEY = "verification_integration_settings";
const TTL_MS = 60_000;

export type VerificationIntegrationSecrets = {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeIdentitySuccessUrl: string;
  retentionDays: number;
};

type Cache = { at: number; value: VerificationIntegrationSecrets };

let cache: Cache | null = null;

function fromEnv(): VerificationIntegrationSecrets {
  const retention = Number(process.env.VERIFICATION_RETENTION_DAYS ?? "30");
  return {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
    stripeIdentitySuccessUrl: process.env.STRIPE_IDENTITY_SUCCESS_URL?.trim() ?? "",
    retentionDays: Number.isFinite(retention) && retention > 0 ? retention : 30,
  };
}

function mergeStored(raw: Record<string, unknown>, base: VerificationIntegrationSecrets): VerificationIntegrationSecrets {
  const next = { ...base };
  if (typeof raw.stripeSecretKey === "string" && raw.stripeSecretKey.trim()) {
    next.stripeSecretKey = raw.stripeSecretKey.trim();
  }
  if (typeof raw.stripeWebhookSecret === "string" && raw.stripeWebhookSecret.trim()) {
    next.stripeWebhookSecret = raw.stripeWebhookSecret.trim();
  }
  if (typeof raw.stripeIdentitySuccessUrl === "string" && raw.stripeIdentitySuccessUrl.trim()) {
    next.stripeIdentitySuccessUrl = raw.stripeIdentitySuccessUrl.trim();
  }
  if (typeof raw.retentionDays === "number" && raw.retentionDays > 0) {
    next.retentionDays = raw.retentionDays;
  }
  return next;
}

export async function getVerificationIntegrationConfig(): Promise<VerificationIntegrationSecrets> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const base = fromEnv();
  const config = serverConfig();
  if (!config) {
    cache = { at: Date.now(), value: base };
    return base;
  }

  try {
    const admin = createClient(config.url, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await admin
      .from("habitus_platform_config")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    const value =
      data?.value && typeof data.value === "object"
        ? mergeStored(data.value as Record<string, unknown>, base)
        : base;

    cache = { at: Date.now(), value };
    return value;
  } catch {
    cache = { at: Date.now(), value: base };
    return base;
  }
}

export function clearIntegrationCache(): void {
  cache = null;
}

export function maskIntegrationConfig(secrets: VerificationIntegrationSecrets, stored: Record<string, unknown>) {
  const dbStripe = typeof stored.stripeSecretKey === "string" && stored.stripeSecretKey.trim();
  const dbWebhook = typeof stored.stripeWebhookSecret === "string" && stored.stripeWebhookSecret.trim();
  const envStripe = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const envWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const envUrl = Boolean(process.env.STRIPE_IDENTITY_SUCCESS_URL?.trim());

  return {
    stripeConfigured: Boolean(secrets.stripeSecretKey),
    stripeSecretSource: dbStripe ? "database" : envStripe ? "environment" : "none",
    webhookConfigured: Boolean(secrets.stripeWebhookSecret),
    webhookSecretSource: dbWebhook ? "database" : envWebhook ? "environment" : "none",
    stripeIdentitySuccessUrl: secrets.stripeIdentitySuccessUrl,
    successUrlSource:
      typeof stored.stripeIdentitySuccessUrl === "string" && stored.stripeIdentitySuccessUrl.trim()
        ? "database"
        : envUrl
          ? "environment"
          : "none",
    retentionDays: secrets.retentionDays,
    ready: Boolean(secrets.stripeSecretKey && secrets.stripeIdentitySuccessUrl),
  };
}
