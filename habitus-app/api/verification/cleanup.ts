import type { VercelRequest, VercelResponse } from "@vercel/node";
import { audit, serverConfig } from "../_lib/verification.js";
import { getVerificationIntegrationConfig } from "../_lib/integrationRuntime.js";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") { res.status(405).end(); return; }
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "No autorizado." }); return;
  }
  const cfg = serverConfig();
  if (!cfg) { res.status(503).json({ error: "Supabase no configurado." }); return; }
  const admin = createClient(cfg.url, cfg.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { retentionDays } = await getVerificationIntegrationConfig();
  const cutoff = new Date(Date.now() - Math.max(1, retentionDays) * 86400000).toISOString();
  const { data: checks, error } = await admin.from("verification_checks").select("*")
    .eq("verification_type", "basic_trust").is("documents_deleted_at", null).lt("created_at", cutoff).limit(100);
  if (error) { res.status(500).json({ error: error.message }); return; }
  let deleted = 0;
  for (const check of checks ?? []) {
    const paths = [check.document_front_path, check.document_back_path, check.selfie_path, check.selfie_code_path]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (paths.length) {
      const { error: removeError } = await admin.storage.from("verification-documents").remove(paths);
      if (removeError) continue;
    }
    await admin.from("verification_checks").update({
      document_front_path: null, document_back_path: null, selfie_path: null, selfie_code_path: null,
      documents_deleted_at: new Date().toISOString(),
    }).eq("id", check.id);
    await audit(admin, check.id, check.user_id, "system", null, "documents_deleted", { retention_days: retentionDays });
    deleted += 1;
  }
  res.status(200).json({ deleted, scanned: checks?.length ?? 0 });
}
