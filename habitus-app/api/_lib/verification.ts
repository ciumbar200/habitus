import type { SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";
export { authenticate, bodyOf, serverConfig, type ServerAuth } from "./auth.js";

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
