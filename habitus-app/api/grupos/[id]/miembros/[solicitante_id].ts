import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["PUT"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = jsonBody(req);
    const grupoId = routeId(req);
    const solicitanteId = routeId(req, "solicitante_id");
    const estado = body.estado === "approved" ? "approved" : "rejected";

    const { data: request, error: requestError } = await auth.userClient
      .from("habitus_group_join_requests")
      .select("id")
      .eq("grupo_id", grupoId)
      .eq("solicitante_id", solicitanteId)
      .eq("estado", "pending")
      .single();

    if (requestError || !request) {
      res.status(404).json({ error: requestError?.message ?? "Solicitud no encontrada." });
      return;
    }

    if (estado === "approved") {
      const { data, error } = await auth.userClient.rpc("aprobar_group_join_request", {
        p_request_id: request.id,
        p_leader_id: auth.userId,
      });
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(200).json({ data });
      return;
    }

    const { data, error } = await auth.userClient
      .from("habitus_group_join_requests")
      .update({
        estado,
        responded_by: auth.userId,
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .select("*")
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
