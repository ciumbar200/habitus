import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["POST"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = jsonBody(req);

    const { data, error } = await auth.userClient
      .from("habitus_gastos_piso")
      .insert({
        piso_id: body.piso_id,
        concepto: body.concepto,
        importe: body.importe,
        tipo: body.tipo,
        periodicidad: body.periodicidad,
        fecha: body.fecha,
        created_by: auth.userId,
      })
      .select()
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
