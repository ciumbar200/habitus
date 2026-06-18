import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const [habitacion, piso] = await Promise.all([
      auth.userClient
        .from("habitus_contratos_habitacion")
        .select("id, fecha_inicio, fecha_fin, renta_mensual, habitacion:habitacion_id(name)")
        .eq("anfitrion_id", auth.userId)
        .eq("estado", "activo"),
      auth.userClient
        .from("habitus_contratos_piso")
        .select("id, fecha_inicio, fecha_fin, renta_mensual, piso:piso_id(name), grupo:grupo_id(name)")
        .eq("propietario_id", auth.userId)
        .eq("estado", "activo"),
    ]);

    if (habitacion.error || piso.error) {
      res.status(400).json({ error: habitacion.error?.message ?? piso.error?.message });
      return;
    }

    res.status(200).json({
      data: [
        ...(habitacion.data ?? []).map((row) => ({ ...row, tipo: "habitacion" })),
        ...(piso.data ?? []).map((row) => ({ ...row, tipo: "piso" })),
      ],
    });
  } catch (err) {
    fail(res, err);
  }
}
