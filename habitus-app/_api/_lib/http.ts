import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate, bodyOf } from "./verification.js";

export function method(req: VercelRequest, res: VercelResponse, allowed: string[]): boolean {
  if (allowed.includes(req.method ?? "")) return true;
  res.status(405).json({ error: "Method not allowed." });
  return false;
}

export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  const auth = await authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "No autenticado." });
    return null;
  }
  return auth;
}

export function jsonBody(req: VercelRequest): Record<string, unknown> {
  return bodyOf(req);
}

export function routeId(req: VercelRequest, name = "id"): string {
  const value = req.query[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function fail(res: VercelResponse, error: unknown, status = 500): void {
  res.status(status).json({ error: error instanceof Error ? error.message : "Internal error." });
}
