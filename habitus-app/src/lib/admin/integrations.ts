import { supabase } from "../supabase";

export type IntegrationHealth = {
  stripe: {
    stripeConfigured: boolean;
    stripeSecretSource: "database" | "environment" | "none";
    webhookConfigured: boolean;
    webhookSecretSource: "database" | "environment" | "none";
    stripeIdentitySuccessUrl: string;
    successUrlSource: "database" | "environment" | "none";
    retentionDays: number;
    ready: boolean;
  };
  ai: {
    configured: boolean;
    source: "database" | "environment" | "none";
  };
  updatedAt: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("No autenticado");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchIntegrationHealth(): Promise<IntegrationHealth> {
  const res = await fetch("/api/admin/integrations", { headers: await authHeaders() });
  const payload = (await res.json()) as IntegrationHealth & { error?: string };
  if (!res.ok) throw new Error(payload.error ?? "No se pudo cargar el estado de integraciones");
  return payload;
}

export async function saveStripeIntegration(input: {
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeIdentitySuccessUrl?: string;
  retentionDays?: number;
  clearStripeSecret?: boolean;
  clearWebhookSecret?: boolean;
}): Promise<IntegrationHealth["stripe"]> {
  const res = await fetch("/api/admin/integrations", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await res.json()) as { stripe?: IntegrationHealth["stripe"]; error?: string };
  if (!res.ok) throw new Error(payload.error ?? "No se pudo guardar");
  return payload.stripe!;
}
