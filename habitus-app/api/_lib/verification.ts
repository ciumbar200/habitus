import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

export type ServerAuth = {
  userId: string;
  isAdmin: boolean;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
};

export function serverConfig() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && anonKey && serviceKey ? { url, anonKey, serviceKey } : null;
}

export async function authenticate(req: VercelRequest): Promise<ServerAuth | null> {
  const config = serverConfig();
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!config || !token) return null;

  const userClient = createClient(config.url, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await userClient.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await userClient
    .from("habitus_profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  const adminClient = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { userId: data.user.id, isAdmin: profile?.is_admin === true, userClient, adminClient };
}

export function bodyOf(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === "string") return JSON.parse(req.body) as Record<string, unknown>;
  return (req.body ?? {}) as Record<string, unknown>;
}

export async function audit(
  admin: SupabaseClient,
  checkId: string,
  userId: string,
  actorType: "user" | "admin" | "system" | "ai" | "stripe",
  actorId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await admin.from("verification_audit_logs").insert({
    verification_check_id: checkId,
    user_id: userId,
    actor_type: actorType,
    actor_id: actorId,
    action,
    metadata,
  });
}

export async function getSignedDocuments(admin: SupabaseClient, paths: Array<string | null>) {
  return Promise.all(
    paths.map(async (path) => {
      if (!path) return null;
      const { data } = await admin.storage.from("verification-documents").createSignedUrl(path, 300);
      return data?.signedUrl ?? null;
    }),
  );
}
