import { supabase } from "../supabase";

export type AdminAiConfigView = {
  gatewayBaseUrl: string;
  defaultModel: string;
  matchModel: string;
  safetyModel: string;
  visionModel: string;
  apiKeyConfigured: boolean;
  apiKeySource: "database" | "environment" | "none";
};

export async function fetchAdminAiConfig(): Promise<{
  config: AdminAiConfigView;
  updatedAt: string | null;
}> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("No autenticado");

  const res = await fetch("/api/admin/ai-config", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await res.json()) as {
    config?: AdminAiConfigView;
    updatedAt?: string | null;
    error?: string;
  };
  if (!res.ok) throw new Error(payload.error ?? "No se pudo cargar la configuración IA");
  return { config: payload.config!, updatedAt: payload.updatedAt ?? null };
}

export async function saveAdminAiConfig(input: {
  gatewayBaseUrl?: string;
  defaultModel?: string;
  matchModel?: string;
  safetyModel?: string;
  visionModel?: string;
  apiKey?: string;
  clearApiKey?: boolean;
}): Promise<AdminAiConfigView> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("No autenticado");

  const res = await fetch("/api/admin/ai-config", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await res.json()) as { config?: AdminAiConfigView; error?: string };
  if (!res.ok) throw new Error(payload.error ?? "No se pudo guardar");
  return payload.config!;
}
