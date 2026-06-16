import { supabase } from "../supabase";
import type { AgentName } from "./schemas";

/** Error de agente IA con flag `retryable` para que la UI decida si ofrecer reintentar. */
export class AgentError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "AgentError";
    this.retryable = retryable;
  }
}

export async function runMoonAgent<T extends Record<string, unknown>>(
  agentName: AgentName,
  input: Record<string, unknown>,
  options: { propertyId?: string; force?: boolean } = {},
): Promise<{ result: T; cached: boolean }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AgentError("Inicia sesión para usar el análisis IA.");

  // Sin reintento automático aquí: el servidor ya hace backoff sobre el gateway
  // (client.ts). Reintentar en el cliente duplicaría las llamadas al gateway.
  let response: Response;
  try {
    response = await fetch("/api/ai/run", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ agentName, input, propertyId: options.propertyId, force: options.force }),
    });
  } catch {
    throw new AgentError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.", true);
  }

  const payload = await response.json() as {
    result?: T;
    cached?: boolean;
    error?: string;
    retryable?: boolean;
  };
  if (response.ok && payload.result) {
    return { result: payload.result, cached: payload.cached === true };
  }
  throw new AgentError(payload.error || "No se pudo completar el análisis IA.", payload.retryable === true);
}
