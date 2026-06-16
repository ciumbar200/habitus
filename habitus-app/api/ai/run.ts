import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate, bodyOf } from "../_lib/verification.js";
import { agents } from "../../src/lib/ai/agents/index.js";
import { AIConfigurationError, AIRateLimitError, runStructuredAgent } from "../../src/lib/ai/client.js";
import type { AgentName } from "../../src/lib/ai/schemas/index.js";

const TABLES: Partial<Record<AgentName, string>> = {
  tenantProfileAgent: "user_ai_profiles", propertyIntelligenceAgent: "property_ai_profiles",
  moonMatchAgent: "match_ai_scores", listingQualityAgent: "listing_quality_reports",
  safetyAgent: "safety_reviews", operatorInsightsAgent: "operator_ai_reports",
};

/** Límite diario de análisis IA por usuario. Configurable vía AI_DAILY_LIMIT. */
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 20;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value);
}

async function log(admin: SupabaseClient, row: Record<string, unknown>) {
  const { error } = await admin.from("ai_usage_logs").insert(row);
  if (error) console.error("[ai-usage-log]", error.message);
}

async function ownsProperty(admin: SupabaseClient, propertyId: string, userId: string) {
  const { data } = await admin.from("habitus_listings").select("id").eq("id", propertyId)
    .or(`owner_profile_id.eq.${userId},host_profile_id.eq.${userId}`).maybeSingle();
  return Boolean(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido." }); return; }
  const started = Date.now();
  let auth: Awaited<ReturnType<typeof authenticate>> = null;
  let agentName = "unknown";
  let propertyId: string | null = null;
  try {
    auth = await authenticate(req);
    if (!auth) { res.status(401).json({ error: "No autenticado." }); return; }
    const body = bodyOf(req);
    agentName = String(body.agentName ?? "");
    if (!(agentName in agents)) { res.status(400).json({ error: "Agente IA no válido." }); return; }
    if (agentName === "basicTrustAgent") { res.status(400).json({ error: "Usa el flujo seguro de verificación básica." }); return; }
    const agent = agents[agentName as AgentName];
    const input = body.input && typeof body.input === "object" ? body.input : {};
    propertyId = typeof body.propertyId === "string" ? body.propertyId : null;
    const force = body.force === true;

    if (["propertyIntelligenceAgent", "listingQualityAgent"].includes(agentName)) {
      if (!propertyId || (!auth.isAdmin && !(await ownsProperty(auth.adminClient, propertyId, auth.userId)))) {
        res.status(403).json({ error: "No puedes analizar esta propiedad." }); return;
      }
    }
    if (agentName === "moonMatchAgent" && !propertyId) { res.status(400).json({ error: "Falta propertyId." }); return; }
    if (agentName === "safetyAgent" && !auth.isAdmin) { res.status(403).json({ error: "La revisión safety requiere admin." }); return; }
    if (agentName === "operatorInsightsAgent" && !auth.isAdmin) {
      const { data: profile } = await auth.adminClient.from("habitus_profiles").select("account_role").eq("id", auth.userId).single();
      if (profile?.account_role !== "agencia") { res.status(403).json({ error: "Este informe requiere rol operador." }); return; }
    }

    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await auth.adminClient.from("ai_usage_logs").select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId).eq("status", "success").gte("created_at", since);
    if ((count ?? 0) >= AI_DAILY_LIMIT) {
      await log(auth.adminClient, { agent_name: agentName, model_used: process.env[agent.modelEnv] || "not-called", user_id: auth.userId, property_id: propertyId, status: "rate_limited" });
      res.status(429).json({ error: `Has alcanzado el límite diario de análisis IA (${AI_DAILY_LIMIT} al día). Vuelve más tarde.`, retryable: false }); return;
    }

    const inputHash = createHash("sha256").update(stable({ agentName, input, propertyId })).digest("hex");
    const table = TABLES[agent.name];
    if (!force && table) {
      let query = auth.adminClient.from(table).select("result,input_hash").eq("input_hash", inputHash);
      if (agent.name === "tenantProfileAgent") query = query.eq("user_id", auth.userId);
      if (["propertyIntelligenceAgent", "listingQualityAgent"].includes(agent.name)) query = query.eq("property_id", propertyId!);
      if (agent.name === "moonMatchAgent") query = query.eq("user_id", auth.userId).eq("property_id", propertyId!);
      if (agent.name === "operatorInsightsAgent") query = query.eq("operator_id", auth.userId);
      const { data: cached } = await query.limit(1).maybeSingle();
      if (cached?.result) {
        await log(auth.adminClient, { agent_name: agentName, model_used: "cached", user_id: auth.userId, property_id: propertyId, input_hash: inputHash, status: "cached", duration_ms: Date.now() - started });
        res.status(200).json({ result: cached.result, cached: true }); return;
      }
    }

    const { result, model } = await runStructuredAgent(agent, input);
    const confidence = typeof result.confidence_score === "number" ? result.confidence_score : null;
    if (agent.name === "tenantProfileAgent") await auth.adminClient.from("user_ai_profiles").upsert({ user_id: auth.userId, input_hash: inputHash, result, model_used: model, confidence_score: confidence });
    if (agent.name === "propertyIntelligenceAgent") await auth.adminClient.from("property_ai_profiles").upsert({ property_id: propertyId, input_hash: inputHash, result, model_used: model, confidence_score: confidence });
    if (agent.name === "moonMatchAgent") await auth.adminClient.from("match_ai_scores").upsert({ user_id: auth.userId, property_id: propertyId, input_hash: inputHash, result, model_used: model, match_score: result.match_score, confidence_score: confidence }, { onConflict: "user_id,property_id" });
    if (agent.name === "listingQualityAgent") await auth.adminClient.from("listing_quality_reports").upsert({ property_id: propertyId, requested_by: auth.userId, input_hash: inputHash, result, model_used: model, quality_score: result.quality_score });
    if (agent.name === "safetyAgent") await auth.adminClient.from("safety_reviews").insert({ subject_type: String((input as Record<string, unknown>).subject_type || "profile"), subject_id: String((input as Record<string, unknown>).subject_id || auth.userId), requested_by: auth.userId, input_hash: inputHash, result, model_used: model, risk_level: result.risk_level });
    if (agent.name === "operatorInsightsAgent") {
      const today = new Date(); const start = new Date(today); start.setDate(today.getDate() - 6);
      await auth.adminClient.from("operator_ai_reports").upsert({ operator_id: auth.userId, period_start: start.toISOString().slice(0, 10), period_end: today.toISOString().slice(0, 10), input_hash: inputHash, result, model_used: model }, { onConflict: "operator_id,period_start,period_end" });
    }
    await log(auth.adminClient, { agent_name: agentName, model_used: model, user_id: auth.userId, property_id: propertyId, input_hash: inputHash, status: "success", duration_ms: Date.now() - started });
    res.status(200).json({ result, cached: false });
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      console.warn("[moon-ai] rate-limited (gateway saturado tras reintentos)", agentName);
      if (auth) await log(auth.adminClient, { agent_name: agentName, model_used: "not-called", user_id: auth.userId, property_id: propertyId, status: "rate_limited", error_message: error.message.slice(0, 1000), duration_ms: Date.now() - started });
      res.status(429).json({ error: error.message, retryable: true, retryAfter: error.retryAfter ?? 5 });
      return;
    }
    const message = error instanceof Error ? error.message : "Error IA desconocido";
    console.error("[moon-ai]", agentName, message);
    if (auth) await log(auth.adminClient, { agent_name: agentName, model_used: "not-called", user_id: auth.userId, property_id: propertyId, status: error instanceof AIConfigurationError ? "not_configured" : "error", error_message: message.slice(0, 1000), duration_ms: Date.now() - started });
    res.status(error instanceof AIConfigurationError ? 503 : 500).json({ error: message });
  }
}
