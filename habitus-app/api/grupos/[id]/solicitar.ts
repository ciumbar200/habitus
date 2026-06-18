import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["POST"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = jsonBody(req);

    const { data, error } = await auth.userClient
      .from("habitus_group_join_requests")
      .insert({
        grupo_id: routeId(req),
        solicitante_id: auth.userId,
        mensaje: body.mensaje || null,
        estado: "pending",
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
