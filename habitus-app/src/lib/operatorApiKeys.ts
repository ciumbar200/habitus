import { supabase } from "./supabase";

export type OperatorApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatedOperatorApiKey = {
  key: OperatorApiKey;
  secret: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No hay sesión activa.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchOperatorApiKeys(): Promise<OperatorApiKey[]> {
  const res = await fetch("/api/operator/api-keys", {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudieron cargar las claves.");
  }
  const payload = (await res.json()) as { keys: OperatorApiKey[] };
  return payload.keys ?? [];
}

export async function createOperatorApiKey(
  label: string,
  scopes: string[] = ["listings:read", "listings:write", "applications:read"],
): Promise<CreatedOperatorApiKey> {
  const res = await fetch("/api/operator/api-keys", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ label, scopes }),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo crear la clave.");
  }
  return (await res.json()) as CreatedOperatorApiKey;
}

export async function revokeOperatorApiKey(id: string): Promise<void> {
  const res = await fetch("/api/operator/api-keys", {
    method: "DELETE",
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo revocar la clave.");
  }
}
