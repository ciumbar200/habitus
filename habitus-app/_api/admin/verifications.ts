import type { VercelRequest, VercelResponse } from "@vercel/node";
import { audit, authenticate, bodyOf, getSignedDocuments } from "../_lib/verification.js";

const ACTIONS = new Set(["approve", "reject", "retry", "require_stripe", "suspicious"]);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const auth = await authenticate(req);
    if (!auth) { res.status(401).json({ error: "No autenticado." }); return; }
    if (!auth.isAdmin) { res.status(403).json({ error: "Acceso solo para administradores." }); return; }

    if (req.method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      let query = auth.adminClient.from("verification_checks").select("*").order("created_at", { ascending: false }).limit(200);
      if (id) query = query.eq("id", id);
      const { data: checks, error } = await query;
      if (error) throw error;
      const userIds = [...new Set((checks ?? []).map((c) => c.user_id as string))];
      const { data: profiles } = userIds.length
        ? await auth.adminClient.from("habitus_profiles").select("id, display_name, account_role").in("id", userIds)
        : { data: [] };
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const rows = await Promise.all((checks ?? []).map(async (check) => {
        const documents = id ? await getSignedDocuments(auth.adminClient, [
          check.document_front_path, check.document_back_path, check.selfie_path, check.selfie_code_path,
        ]) : [null, null, null, null];
        return { ...check, profile: profileMap.get(check.user_id) ?? null, documents };
      }));
      res.status(200).json({ checks: rows }); return;
    }

    if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido." }); return; }
    const body = bodyOf(req);
    const id = String(body.checkId ?? "");
    const action = String(body.action ?? "");
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    if (!ACTIONS.has(action)) { res.status(400).json({ error: "Acción no válida." }); return; }
    const { data: check } = await auth.adminClient.from("verification_checks").select("*").eq("id", id).maybeSingle();
    if (!check) { res.status(404).json({ error: "Verificación no encontrada." }); return; }

    let status = check.status as string;
    let badge = check.public_badge as string;
    const flags = Array.isArray(check.risk_flags) ? [...check.risk_flags] : [];
    if (action === "approve") { status = "basic_approved"; badge = "basic_trust"; }
    if (action === "reject") { status = "basic_rejected"; badge = "none"; }
    if (action === "retry") { status = "basic_pending"; badge = "none"; }
    if (action === "require_stripe") { status = "advanced_required"; }
    if (action === "suspicious") { status = "advanced_required"; if (!flags.includes("admin_suspicious")) flags.push("admin_suspicious"); }

    const now = new Date().toISOString();
    const { error } = await auth.adminClient.from("verification_checks").update({
      status, public_badge: badge, risk_flags: flags, rejection_reason: reason,
      reviewed_by: auth.userId, reviewed_at: now,
    }).eq("id", id);
    if (error) throw error;
    await auth.adminClient.from("habitus_profiles").update({
      verification_status: status,
      verification_badge: badge,
      identity_status: status === "basic_approved" ? "verified" : status === "basic_pending" ? "pending" : check.status === "stripe_verified" ? "verified" : "none",
      basic_trust_verified_at: status === "basic_approved" ? now : null,
    }).eq("id", check.user_id);
    await audit(auth.adminClient, id, check.user_id, "admin", auth.userId, `admin_${action}`, { reason, risk_flags: flags });
    res.status(200).json({ status, publicBadge: badge });
  } catch (error) {
    console.error("[admin-verifications]", error);
    res.status(500).json({ error: "No se pudo actualizar la verificación." });
  }
}
