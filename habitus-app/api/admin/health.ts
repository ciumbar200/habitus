import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate } from "../_lib/auth.js";

/** Comprueba si las funciones admin del servidor tienen las variables necesarias. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const auth = await authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }
  if (!auth.isAdmin) {
    res.status(403).json({ error: "Acceso solo para administradores." });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const importUsersReady = Boolean(supabaseUrl && anonKey && serviceKey);

  res.status(importUsersReady ? 200 : 503).json({
    importUsersReady,
    missing: [
      !supabaseUrl && "SUPABASE_URL / VITE_SUPABASE_URL",
      !anonKey && "SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY",
      !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean),
  });
}
