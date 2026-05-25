import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Stub de notificaciones backend.
 * Integrar OneSignal REST + email transaccional cuando esté configurado.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as {
    type?: string;
    profileIds?: string[];
    title?: string;
    body?: string;
  };

  if (!body?.type || !body.profileIds?.length) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // TODO: OneSignal REST API + Resend/Brevo cuando haya credenciales en env
  console.info("[notify]", body.type, body.profileIds.length, body.title);

  return res.status(202).json({ queued: true });
}
