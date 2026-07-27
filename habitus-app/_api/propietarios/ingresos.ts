import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const [habitacion, piso] = await Promise.all([
      auth.userClient
        .from("habitus_contratos_habitacion")
        .select("renta_mensual")
        .eq("anfitrion_id", auth.userId)
        .eq("estado", "activo"),
      auth.userClient
        .from("habitus_contratos_piso")
        .select("renta_mensual")
        .eq("propietario_id", auth.userId)
        .eq("estado", "activo"),
    ]);

    if (habitacion.error || piso.error) {
      res.status(400).json({ error: habitacion.error?.message ?? piso.error?.message });
      return;
    }

    const ingresos =
      (habitacion.data ?? []).reduce((sum, row) => sum + Number(row.renta_mensual), 0) +
      (piso.data ?? []).reduce((sum, row) => sum + Number(row.renta_mensual), 0);

    res.status(200).json({
      ingresos_mensuales_actuales: ingresos,
      ingresos_proyectados_mes: ingresos,
      ingresos_proyectados_trimestre: ingresos * 3,
      ingresos_proyectados_anio: ingresos * 12,
    });
  } catch (err) {
    fail(res, err);
  }
}
