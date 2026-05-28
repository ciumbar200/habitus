/**
 * ADM-24: Broadcast notificación segmentada
 * POST { title, body, type?, roleFilter?, cityFilter?, dryRun? }
 * dryRun=true → devuelve conteo sin insertar nada
 */
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_RECIPIENTS = 500;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed." }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceKey) {
      res.status(503).json({ error: "Missing SUPABASE env vars.", code: "server_config" }); return;
    }

    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) { res.status(401).json({ error: "Token requerido." }); return; }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) { res.status(401).json({ error: "No autenticado." }); return; }
    const { data: profile } = await anonClient
      .from("habitus_profiles").select("is_admin").eq("id", caller.id).single();
    if (!profile?.is_admin) { res.status(403).json({ error: "Admin required." }); return; }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { title, body: msgBody, type = "admin_broadcast", roleFilter, cityFilter, dryRun = false } = body as {
      title: string; body: string; type?: string;
      roleFilter?: string; cityFilter?: string; dryRun?: boolean;
    };

    if (!title?.trim() || !msgBody?.trim()) {
      res.status(400).json({ error: "title y body son obligatorios." }); return;
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find matching profiles
    let query = adminClient
      .from("habitus_profiles")
      .select("id")
      .is("deleted_at", null)
      .is("suspended_at", null);

    if (roleFilter) query = query.eq("account_role", roleFilter);
    if (cityFilter) query = query.eq("city", cityFilter);

    const { data: targets, error: targetsErr } = await query.limit(MAX_RECIPIENTS);
    if (targetsErr) { res.status(500).json({ error: targetsErr.message }); return; }
    if (!targets || targets.length === 0) {
      res.status(200).json({ ok: true, count: 0, dryRun, message: "No recipients match filters." }); return;
    }

    if (dryRun) {
      res.status(200).json({ ok: true, count: targets.length, dryRun: true }); return;
    }

    // Insert notifications in batches of 100
    const rows = targets.map((t) => ({
      profile_id: t.id,
      type,
      title: title.trim(),
      body: msgBody.trim(),
      data: { source: "admin_broadcast", sentBy: caller.id },
    }));

    let sent = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await adminClient.from("habitus_notifications").insert(rows.slice(i, i + 100));
      if (!error) sent += Math.min(100, rows.length - i);
    }

    res.status(200).json({ ok: true, count: sent, dryRun: false });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error." });
  }
}
