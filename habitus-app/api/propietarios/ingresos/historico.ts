import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const meses = Number(req.query.meses ?? 12);
    const { data, error } = await auth.userClient.rpc("propietario_historico_ingresos", {
      p_propietario_id: auth.userId,
      p_meses: Number.isFinite(meses) ? meses : 12,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(200).json({ data });
  } catch (err) {
    fail(res, err);
  }
}
