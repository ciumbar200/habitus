import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth, routeId } from "../../../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["PUT"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { data, error } = await auth.userClient.rpc("aceptar_contrato_piso_miembro", {
      p_contrato_id: routeId(req),
      p_user_id: auth.userId,
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
