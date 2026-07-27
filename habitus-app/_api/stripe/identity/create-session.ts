import type { VercelRequest, VercelResponse } from "@vercel/node";
import { audit, authenticate } from "../../_lib/verification.js";
import { getVerificationIntegrationConfig } from "../../_lib/integrationRuntime.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido." }); return; }
  try {
    const auth = await authenticate(req);
    if (!auth) { res.status(401).json({ error: "No autenticado." }); return; }
    const { stripeSecretKey: stripeKey, stripeIdentitySuccessUrl: returnUrl } =
      await getVerificationIntegrationConfig();
    if (!stripeKey || !returnUrl) { res.status(503).json({ error: "Stripe Identity no está configurado." }); return; }

    const { data: existing } = await auth.adminClient.from("verification_checks").select("*")
      .eq("user_id", auth.userId).eq("verification_type", "stripe_identity")
      .in("status", ["stripe_pending", "stripe_verified"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing?.status === "stripe_verified") {
      res.status(409).json({ error: "La identidad ya está verificada." }); return;
    }
    if (existing?.stripe_verification_session_id) {
      const current = await fetch(`https://api.stripe.com/v1/identity/verification_sessions/${existing.stripe_verification_session_id}`, {
        headers: { Authorization: `Bearer ${stripeKey}`, "Stripe-Version": "2026-02-25.clover" },
      });
      if (current.ok) {
        const session = await current.json() as { url?: string; client_secret?: string; status?: string };
        if (session.url) { res.status(200).json({ url: session.url, clientSecret: session.client_secret, reused: true }); return; }
      }
    }

    const { data: check, error: createError } = await auth.adminClient.from("verification_checks").insert({
      user_id: auth.userId, verification_type: "stripe_identity", status: "stripe_pending",
      stripe_status: "requires_input", expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    }).select("*").single();
    if (createError || !check) throw createError ?? new Error("No se pudo crear el control");

    const form = new URLSearchParams();
    form.set("type", "document");
    form.set("return_url", returnUrl);
    form.set("client_reference_id", auth.userId);
    form.set("metadata[user_id]", auth.userId);
    form.set("metadata[check_id]", check.id);
    form.set("options[document][require_matching_selfie]", "true");
    const response = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-02-25.clover",
      },
      body: form,
    });
    const session = await response.json() as { id?: string; url?: string; client_secret?: string; error?: { message?: string } };
    if (!response.ok || !session.id) throw new Error(session.error?.message ?? "Stripe Identity error");
    await auth.adminClient.from("verification_checks").update({ stripe_verification_session_id: session.id }).eq("id", check.id);
    await auth.adminClient.from("habitus_profiles").update({ verification_status: "stripe_pending" }).eq("id", auth.userId);
    await audit(auth.adminClient, check.id, auth.userId, "user", auth.userId, "stripe_session_created", { session_id: session.id });
    res.status(200).json({ url: session.url, clientSecret: session.client_secret });
  } catch (error) {
    console.error("[stripe-identity-session]", error);
    res.status(500).json({ error: "No se pudo iniciar Stripe Identity." });
  }
}
