import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, jsonBody, method, requireAuth, routeId } from "../../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!method(req, res, ["POST"])) return;
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = jsonBody(req);

    const { data: invite, error: inviteError } = await auth.adminClient
      .from("habitus_group_invites")
      .select("*")
      .eq("token", routeId(req, "token"))
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      res.status(404).json({ error: inviteError?.message ?? "Invitación no encontrada." });
      return;
    }

    if (Number(invite.uses_count) >= Number(invite.max_uses)) {
      res.status(400).json({ error: "El enlace ha alcanzado el máximo de usos." });
      return;
    }

    const { data, error } = await auth.userClient
      .from("habitus_group_join_requests")
      .insert({
        grupo_id: invite.grupo_id,
        solicitante_id: auth.userId,
        mensaje: body.mensaje || "Solicitud mediante enlace de invitación",
        estado: "pending",
      })
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    await auth.adminClient
      .from("habitus_group_invites")
      .update({ uses_count: Number(invite.uses_count) + 1 })
      .eq("id", invite.id);

    res.status(201).json({ data });
  } catch (err) {
    fail(res, err);
  }
}
