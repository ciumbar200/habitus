import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../_lib/http";

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i += 1) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["POST"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = jsonBody(req);
    const grupoId = routeId(req);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(body.expires_days ?? 30));

    const { data, error } = await auth.userClient
      .from("habitus_group_invites")
      .insert({
        grupo_id: grupoId,
        token: generateToken(),
        created_by: auth.userId,
        max_uses: Number(body.max_uses ?? 5),
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ data });
  } catch (err) {
    fail(res, err);
  }
}
