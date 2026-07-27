import { generateContractPdf } from "../../../../../packages/habitus-core/src/lib/contractPdf.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method, requireAuth, routeId } from "../../../_lib/http.js";

type MemberRow = {
  profile_id: string;
  profile?: { display_name?: string } | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["GET"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const id = routeId(req);
    const { data: contrato, error } = await auth.userClient
      .from("habitus_contratos_piso")
      .select(`
        *,
        piso:piso_id (id, name, location, city),
        propietario:propietario_id (id, display_name),
        grupo:grupo_id (id, name)
      `)
      .eq("id", id)
      .single();

    if (error || !contrato) {
      res.status(404).json({ error: error?.message ?? "Contrato no encontrado." });
      return;
    }

    const { data: members } = await auth.userClient
      .from("habitus_group_members")
      .select("profile_id, profile:profile_id(id, display_name)")
      .eq("group_id", contrato.grupo_id)
      .eq("is_confirmed", true);

    const acceptedMap = contrato.aceptaciones_miembros ?? {};
    const bytes = await generateContractPdf({
      type: "piso",
      reference: contrato.id,
      title: "Contrato de piso completo",
      propertyName: contrato.piso?.name || "Piso",
      propertyLocation: contrato.piso ? `${contrato.piso.location}, ${contrato.piso.city}` : null,
      parties: [
        { label: "Propietario", name: contrato.propietario?.display_name || "Propietario", acceptedAt: contrato.created_at },
        ...(((members ?? []) as MemberRow[]).map((member) => ({
          label: "Miembro del grupo",
          name: member.profile?.display_name || member.profile_id.slice(0, 8),
          acceptedAt: acceptedMap[member.profile_id] ?? null,
        }))),
      ],
      monthlyRent: Number(contrato.renta_mensual),
      depositLabel: new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(contrato.fianza_total)),
      startDate: contrato.fecha_inicio,
      endDate: contrato.fecha_fin,
      specialConditions: contrato.condiciones_especiales,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contrato-piso-${id.slice(0, 8)}.pdf"`);
    res.status(200).send(Buffer.from(bytes));
  } catch (err) {
    fail(res, err);
  }
}
