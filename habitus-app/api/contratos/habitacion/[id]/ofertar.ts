import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["PUT"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const id = routeId(req);
    const body = jsonBody(req);

    const { data, error } = await auth.userClient
      .from("habitus_contratos_habitacion")
      .update({
        inquilino_id: body.inquilino_id,
        estado: "pendiente_firma",
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin || null,
        renta_mensual: body.renta_mensual,
        fianza_meses: body.fianza_meses ?? 2,
        condiciones_especiales: body.condiciones_especiales || null,
      })
      .eq("id", id)
      .eq("anfitrion_id", auth.userId)
      .eq("estado", "borrador")
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
