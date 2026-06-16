import type { AgentDefinition } from "./agents/index.js";

type MessageContent = string | Array<Record<string, unknown>>;

export class AIConfigurationError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Faltan variables IA en el servidor: ${missing.join(", ")}`);
    this.name = "AIConfigurationError";
    this.missing = missing;
  }
}

/** El gateway IA sigue saturado (429) tras agotar los reintentos con backoff. */
export class AIRateLimitError extends Error {
  retryAfter: number | null;

  constructor(retryAfter: number | null) {
    super("El servicio IA está saturado en este momento. Inténtalo de nuevo en unos segundos.");
    this.name = "AIRateLimitError";
    this.retryAfter = retryAfter;
  }
}

function configFor(agent: AgentDefinition) {
  const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  // Vercel refreshes the project OIDC token automatically and bills the
  // request to the deployment's team. Keep the static key as a local/CI fallback.
  const token = env.VERCEL_OIDC_TOKEN?.trim() || env.AI_GATEWAY_API_KEY?.trim();
  const model = env[agent.modelEnv]?.trim() || env.AI_DEFAULT_MODEL?.trim();
  const missing = [!token && "AI_GATEWAY_API_KEY o VERCEL_OIDC_TOKEN", !model && agent.modelEnv].filter(Boolean) as string[];
  if (missing.length) throw new AIConfigurationError(missing);
  return {
    token: token!,
    model: model!,
    baseUrl: (env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/$/, ""),
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_ATTEMPTS = 3; // intento inicial + 2 reintentos
const MAX_BACKOFF_MS = 4000;

export async function runStructuredAgent(
  agent: AgentDefinition,
  input: unknown,
  content?: MessageContent,
): Promise<{ result: Record<string, unknown>; model: string }> {
  const config = configFor(agent);
  const url = `${config.baseUrl}/chat/completions`;
  const init: RequestInit = {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: { name: agent.name, strict: true, schema: agent.schema },
      },
      messages: [
        { role: "system", content: agent.system },
        { role: "user", content: content ?? JSON.stringify(input) },
      ],
    }),
  };

  let lastStatus = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, init);
    if (response.ok) {
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = payload.choices?.[0]?.message?.content;
      if (!raw) throw new Error("AI Gateway devolvió una respuesta vacía.");
      return { result: JSON.parse(raw) as Record<string, unknown>, model: config.model };
    }
    lastStatus = response.status;

    // 429 / 5xx son transitorios: reintentar con backoff antes de fallar.
    const transient = response.status === 429 || response.status >= 500;
    const isLast = attempt === MAX_ATTEMPTS - 1;
    if (!transient || isLast) {
      const detail = (await response.text()).slice(0, 500);
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        throw new AIRateLimitError(retryAfterHeader ? Number(retryAfterHeader) || null : null);
      }
      throw new Error(`AI Gateway ${response.status}: ${detail}`);
    }

    // Backoff exponencial con jitter; respeta Retry-After del gateway (segundos).
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN;
    const backoff = Math.min(800 * 2 ** attempt, MAX_BACKOFF_MS);
    const jitter = Math.floor(Math.random() * 200);
    await sleep(Number.isFinite(retryAfterMs) ? Math.min(retryAfterMs, MAX_BACKOFF_MS) : backoff + jitter);
  }

  throw new Error(`AI Gateway ${lastStatus}: sin respuesta tras ${MAX_ATTEMPTS} intentos.`);
}
