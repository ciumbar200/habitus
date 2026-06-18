import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["POST"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const body = jsonBody(req);
    const rentaMensual = Number(body.renta_mensual);
    const { data, error } = await auth.userClient
      .from("habitus_contratos_piso")
      .insert({
        piso_id: body.piso_id,
        propietario_id: auth.userId,
        grupo_id: body.grupo_id,
        estado: "borrador",
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin || null,
        renta_mensual: rentaMensual,
        fianza_total: body.fianza_total ?? rentaMensual * 2,
        distribucion_renta: body.distribucion_renta || null,
        condiciones_especiales: body.condiciones_especiales || null,
        aceptaciones_miembros: {},
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
