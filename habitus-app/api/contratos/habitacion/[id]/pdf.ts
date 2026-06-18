import { generateContractPdf } from "@habitus/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth, routeId } from "../../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const id = routeId(req);
    const { data: contrato, error } = await auth.userClient
      .from("habitus_contratos_habitacion")
      .select(`
        *,
        habitacion:habitacion_id (
          id,
          name,
          listing:listing_id (id, name, location, city)
        ),
        anfitrion:anfitrion_id (id, display_name),
        inquilino:inquilino_id (id, display_name)
      `)
      .eq("id", id)
      .single();

    if (error || !contrato) {
      res.status(404).json({ error: error?.message ?? "Contrato no encontrado." });
      return;
    }

    const acceptedAt = contrato.estado === "activo" ? contrato.updated_at : null;
    const bytes = await generateContractPdf({
      type: "habitacion",
      reference: contrato.id,
      title: "Contrato de habitación",
      propertyName: contrato.habitacion?.name || "Habitación",
      propertyLocation: contrato.habitacion?.listing
        ? `${contrato.habitacion.listing.location}, ${contrato.habitacion.listing.city}`
        : null,
      parties: [
        { label: "Anfitrión", name: contrato.anfitrion?.display_name || "Anfitrión", acceptedAt: contrato.created_at },
        { label: "Inquilino", name: contrato.inquilino?.display_name || "Inquilino", acceptedAt },
      ],
      monthlyRent: Number(contrato.renta_mensual),
      depositLabel: `${contrato.fianza_meses} ${contrato.fianza_meses === 1 ? "mes" : "meses"}`,
      startDate: contrato.fecha_inicio,
      endDate: contrato.fecha_fin,
      specialConditions: contrato.condiciones_especiales,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contrato-habitacion-${id.slice(0, 8)}.pdf"`);
    res.status(200).send(Buffer.from(bytes));
  } catch (err) {
    fail(res, err);
  }
}
