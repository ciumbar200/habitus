import type { VercelRequest, VercelResponse } from "@vercel/node";
import { audit, authenticate, bodyOf, getSignedDocuments } from "../_lib/verification.js";
import { agents } from "../../src/lib/ai/agents/index.js";
import { AIConfigurationError, runStructuredAgent } from "../../src/lib/ai/client.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido." }); return; }
  try {
    const auth = await authenticate(req);
    if (!auth) { res.status(401).json({ error: "No autenticado." }); return; }
    const checkId = String(bodyOf(req).checkId ?? "");
    const { data: check } = await auth.adminClient.from("verification_checks").select("*")
      .eq("id", checkId).eq("user_id", auth.userId).maybeSingle();
    if (!check || check.verification_type !== "basic_trust") {
      res.status(404).json({ error: "Verificación no encontrada." }); return;
    }

    const [front, back, selfie, selfieCode] = await getSignedDocuments(auth.adminClient, [
      check.document_front_path, check.document_back_path, check.selfie_path, check.selfie_code_path,
    ]);
    const { data: profile } = await auth.adminClient.from("habitus_profiles").select("display_name")
      .eq("id", auth.userId).maybeSingle();
    const content: Array<Record<string, unknown>> = [{
      type: "text",
      text: `Declared name: ${profile?.display_name ?? "unknown"}. Expected handwritten code: ${check.liveness_code}.`,
    }];
    for (const url of [front, back, selfie, selfieCode]) {
      if (url) content.push({ type: "image_url", image_url: { url } });
    }
    const { result, model } = await runStructuredAgent(agents.basicTrustAgent, { checkId }, content);
    const flags = Array.isArray(result.risk_flags) ? result.risk_flags.filter((v) => typeof v === "string") : [];
    const confidence = Number(result.confidence_score);
    await auth.adminClient.from("verification_checks").update({
      ai_result: result,
      risk_flags: flags,
      confidence_score: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : null,
      status: "basic_manual_review",
    }).eq("id", check.id);
    await audit(auth.adminClient, check.id, auth.userId, "ai", null, "ai_precheck_completed", {
      recommended_status: result.recommended_status ?? "basic_manual_review",
      risk_flags: flags,
    });
    await auth.adminClient.from("ai_usage_logs").insert({
      agent_name: "basicTrustAgent", model_used: model, user_id: auth.userId,
      status: "success", input_hash: check.id,
    });
    res.status(200).json({ result, status: "basic_manual_review" });
  } catch (error) {
    console.error("[verification-precheck]", error);
    const detail = error instanceof Error ? error.message : "Error desconocido";
    res.status(error instanceof AIConfigurationError ? 503 : 500).json({
      error: `No se pudo completar la pre-revisión. La revisión manual sigue activa. ${detail}`,
    });
  }
}
