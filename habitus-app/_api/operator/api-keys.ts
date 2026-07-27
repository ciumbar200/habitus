import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type ApiKeyRow = {
  id: string;
  label: string;
  key_prefix: string;
  scopes: string[] | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_SCOPES = ["listings:read", "listings:write", "applications:read"];

function supabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getAuthToken(req: VercelRequest): string {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function normalizeLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function normalizeScopes(value: unknown): string[] {
  const scopes = Array.isArray(value) ? value.filter((v) => typeof v === "string") : DEFAULT_SCOPES;
  return scopes.length > 0 ? scopes.slice(0, 10) : DEFAULT_SCOPES;
}

function generateApiKey(): { secret: string; prefix: string; hash: string } {
  const secret = `moon_op_${randomBytes(24).toString("base64url")}`;
  const prefix = secret.slice(0, 12);
  const hash = createHash("sha256").update(secret).digest("hex");
  return { secret, prefix, hash };
}

async function authenticateUser(req: VercelRequest) {
  const config = supabaseConfig();
  if (!config) return { error: "Faltan variables Supabase en el servidor." as const };

  const token = getAuthToken(req);
  if (!token) return { error: "No autenticado." as const };

  const client = createClient(config.url, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authErr } = await client.auth.getUser();
  if (authErr || !authData.user) return { error: "Sesión inválida." as const };

  const { data: profile, error: profileErr } = await client
    .from("habitus_profiles")
    .select("id, account_role, is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileErr || !profile) return { error: "No se pudo leer el perfil." as const };

  if (!profile.is_admin && profile.account_role !== "agencia") {
    return { error: "Solo operadores o administradores pueden gestionar claves." as const };
  }

  return { client, userId: authData.user.id, isAdmin: profile.is_admin as boolean };
}

function rowToResponse(row: ApiKeyRow) {
  return {
    id: row.id,
    label: row.label,
    keyPrefix: row.key_prefix,
    scopes: row.scopes ?? DEFAULT_SCOPES,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const auth = await authenticateUser(req);
    if ("error" in auth) {
      const status = auth.error === "No autenticado." || auth.error === "Sesión inválida." ? 401 : 403;
      res.status(status).json({ error: auth.error });
      return;
    }

    if (req.method === "GET") {
      const { data, error } = await auth.client
        .from("habitus_operator_api_keys")
        .select("id, label, key_prefix, scopes, last_used_at, revoked_at, created_at, updated_at")
        .eq("profile_id", auth.userId)
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ keys: (data ?? []).map((row) => rowToResponse(row as ApiKeyRow)) });
      return;
    }

    if (req.method === "POST") {
      const raw = req.body;
      const body = typeof raw === "string" ? JSON.parse(raw) : raw;
      const label = normalizeLabel(body?.label);
      const scopes = normalizeScopes(body?.scopes);
      if (!label) {
        res.status(400).json({ error: "Indica un nombre para la clave." });
        return;
      }

      const generated = generateApiKey();
      const { data, error } = await auth.client
        .from("habitus_operator_api_keys")
        .insert({
          profile_id: auth.userId,
          label,
          key_prefix: generated.prefix,
          key_hash: generated.hash,
          scopes,
        })
        .select("id, label, key_prefix, scopes, last_used_at, revoked_at, created_at, updated_at")
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({
        key: rowToResponse(data as ApiKeyRow),
        secret: generated.secret,
      });
      return;
    }

    if (req.method === "DELETE") {
      const raw = req.body;
      const body = typeof raw === "string" ? JSON.parse(raw) : raw;
      const id = typeof body?.id === "string" ? body.id : "";
      if (!id) {
        res.status(400).json({ error: "Falta el id de la clave." });
        return;
      }

      const { error } = await auth.client
        .from("habitus_operator_api_keys")
        .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("profile_id", auth.userId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método no permitido." });
  } catch (error) {
    console.error("[operator-api-keys]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error interno del servidor.",
    });
  }
}
