import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Comprueba si las funciones admin del servidor tienen las variables necesarias. */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
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
