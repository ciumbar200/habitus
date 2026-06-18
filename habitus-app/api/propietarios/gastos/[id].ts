import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET", "PUT", "DELETE"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const id = routeId(req);

    if (req.method === "GET") {
      const { data, error } = await auth.userClient
        .from("habitus_gastos_piso")
        .select("*")
        .eq("piso_id", id)
        .order("fecha", { ascending: false });

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(200).json({ data });
      return;
    }

    if (req.method === "PUT") {
      const body = jsonBody(req);
      const { data, error } = await auth.userClient
        .from("habitus_gastos_piso")
        .update({
          concepto: body.concepto,
          importe: body.importe,
          tipo: body.tipo,
          periodicidad: body.periodicidad,
          fecha: body.fecha,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(200).json({ data });
      return;
    }

    const { error } = await auth.userClient.from("habitus_gastos_piso").delete().eq("id", id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).end();
  } catch (err) {
    fail(res, err);
  }
}
