import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth, routeId } from "../../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["PUT"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { data, error } = await auth.userClient
      .from("habitus_contratos_habitacion")
      .update({ estado: "activo" })
      .eq("id", routeId(req))
      .eq("inquilino_id", auth.userId)
      .eq("estado", "pendiente_firma")
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(200).json({ data });
  } catch (err) {
    fail(res, err);
  }
}
