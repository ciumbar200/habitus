import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { audit, serverConfig } from "../_lib/verification.js";
import { getVerificationIntegrationConfig } from "../_lib/integrationRuntime.js";

export const config = { api: { bodyParser: false } };

async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function validSignature(payload: Buffer, signature: string, secret: string): boolean {
  const parts = signature.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload.toString("utf8")}`).digest("hex");
  return signatures.some((candidate) => {
    try { return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expected, "hex")); }
    catch { return false; }
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") { res.status(405).end(); return; }
  const { stripeWebhookSecret: secret } = await getVerificationIntegrationConfig();
  const cfg = serverConfig();
  if (!secret || !cfg) { res.status(503).json({ error: "Webhook no configurado." }); return; }
  try {
    const payload = await rawBody(req);
    const signature = String(req.headers["stripe-signature"] ?? "");
    if (!validSignature(payload, signature, secret)) { res.status(400).json({ error: "Firma inválida." }); return; }
    const event = JSON.parse(payload.toString("utf8")) as {
      id: string; type: string; data: { object: Record<string, unknown> };
    };
    const session = event.data.object;
    const sessionId = String(session.id ?? "");
    const admin = createClient(cfg.url, cfg.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: check } = await admin.from("verification_checks").select("*")
      .eq("stripe_verification_session_id", sessionId).maybeSingle();
    if (!check) { res.status(200).json({ received: true }); return; }

    let status = check.status as string;
    let badge = check.public_badge as string;
    if (event.type === "identity.verification_session.verified") { status = "stripe_verified"; badge = "identity_verified"; }
    if (event.type === "identity.verification_session.requires_input" || event.type === "identity.verification_session.canceled") {
      status = "stripe_failed";
    }
    if (!["identity.verification_session.verified", "identity.verification_session.requires_input", "identity.verification_session.canceled"].includes(event.type)) {
      res.status(200).json({ received: true }); return;
    }
    const report = typeof session.last_verification_report === "string" ? session.last_verification_report : null;
    const stripeStatus = typeof session.status === "string" ? session.status : null;
    const lastError = session.last_error && typeof session.last_error === "object" ? session.last_error as Record<string, unknown> : null;
    await admin.from("verification_checks").update({
      status, public_badge: badge, stripe_status: stripeStatus,
      stripe_verification_report_id: report,
      rejection_reason: status === "stripe_failed" ? String(lastError?.reason ?? "requires_input") : null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", check.id);
    await admin.from("habitus_profiles").update({
      verification_status: status,
      verification_badge: badge,
      identity_status: status === "stripe_verified" ? "verified" : "none",
      identity_verified_at: status === "stripe_verified" ? new Date().toISOString() : null,
    }).eq("id", check.user_id);
    await audit(admin, check.id, check.user_id, "stripe", null, event.type, { event_id: event.id, stripe_status: stripeStatus });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    res.status(500).json({ error: "Webhook error." });
  }
}
