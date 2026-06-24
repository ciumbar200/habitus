import { supabase } from "../supabase";
import { captureAppError } from "../monitoring";
import type { AgentName } from "./schemas";

export type AgentErrorCode =
  | "no_session"
  | "network"
  | "invalid_response"
  | "daily_quota"
  | "ai_gateway_rate_limited"
  | "server";

/** Error de agente IA con flag `retryable` para que la UI decida si ofrecer reintentar. */
export class AgentError extends Error {
  retryable: boolean;
  retryAfter: number | null;
  code: AgentErrorCode;

  constructor(message: string, retryable = false, retryAfter: number | null = null, code: AgentErrorCode = "server") {
    super(message);
    this.name = "AgentError";
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

export async function runMoonAgent<T extends Record<string, unknown>>(
  agentName: AgentName,
  input: Record<string, unknown>,
  options: { propertyId?: string; force?: boolean } = {},
): Promise<{ result: T; cached: boolean }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AgentError("Inicia sesión para usar el análisis IA.", false, null, "no_session");

  // Sin reintento automático aquí: el servidor ya hace backoff sobre el gateway
  // (client.ts). Reintentar en el cliente duplicaría las llamadas al gateway.
  let response: Response;
  try {
    response = await fetch("/api/ai/run", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ agentName, input, propertyId: options.propertyId, force: options.force }),
    });
  } catch (error) {
    const agentError = new AgentError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.", true, null, "network");
    captureAppError(error, {
      tags: { area: "ai", agent: agentName, retryable: true, status: "network" },
      level: "warning",
    });
    throw agentError;
  }

  let payload: {
    result?: T;
    cached?: boolean;
    error?: string;
    errorCode?: AgentErrorCode;
    retryable?: boolean;
    retryAfter?: number;
  };
  try {
    payload = await response.json() as typeof payload;
  } catch {
    payload = { error: response.ok ? "Respuesta IA inválida." : `No se pudo completar el análisis IA (${response.status}).`, errorCode: response.ok ? "invalid_response" : "server" };
  }
  if (response.ok && payload.result) {
    return { result: payload.result, cached: payload.cached === true };
  }
  const agentError = new AgentError(
    payload.error || "No se pudo completar el análisis IA.",
    payload.retryable === true,
    typeof payload.retryAfter === "number" ? payload.retryAfter : null,
    payload.errorCode ?? "server",
  );
  captureAppError(agentError, {
    tags: {
      area: "ai",
      agent: agentName,
      status: response.status,
      retryable: agentError.retryable,
    },
    extra: {
      propertyId: options.propertyId,
      retryAfter: agentError.retryAfter,
    },
    level: agentError.retryable || response.status === 429 ? "warning" : "error",
  });
  throw agentError;
}
