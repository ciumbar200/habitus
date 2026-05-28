/**
 * ADM-23: Hard delete cron
 * Triggered by Vercel Cron (weekly, Sunday 03:00 UTC).
 * Also callable manually by super-admin via POST with Bearer token.
 *
 * Deletes auth.users where habitus_profiles.deleted_at < now() - 30 days.
 * This is the GDPR hard-delete after the 30-day soft-delete grace period.
 */
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GRACE_DAYS = 30;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      res.status(503).json({ error: "Missing SUPABASE env vars.", code: "server_config" });
      return;
    }

    // Auth: accept Vercel Cron secret OR admin Bearer token
    const authHeader = req.headers.authorization ?? "";
    const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
    const isManual = !isCron && authHeader.startsWith("Bearer ");

    if (!isCron && !isManual) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    // If called manually, verify the caller is admin
    if (isManual) {
      const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
      if (!anonKey) { res.status(503).json({ error: "Missing anon key." }); return; }
      const token = authHeader.slice(7);
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user: caller } } = await anonClient.auth.getUser();
      if (!caller) { res.status(401).json({ error: "Not authenticated." }); return; }
      const { data: profile } = await anonClient
        .from("habitus_profiles")
        .select("is_admin, admin_role")
        .eq("id", caller.id)
        .single();
      if (!profile?.is_admin) {
        res.status(403).json({ error: "Admin required." });
        return;
      }
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find profiles past grace period
    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: profiles, error: fetchErr } = await adminClient
      .from("habitus_profiles")
      .select("id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff);

    if (fetchErr) {
      res.status(500).json({ error: fetchErr.message });
      return;
    }

    if (!profiles || profiles.length === 0) {
      res.status(200).json({ ok: true, deleted: 0, message: "No users to hard-delete." });
      return;
    }

    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const profile of profiles) {
      const { error } = await adminClient.auth.admin.deleteUser(profile.id);
      if (error) {
        failed.push({ id: profile.id, error: error.message });
      } else {
        deleted.push(profile.id);
      }
    }

    res.status(200).json({ ok: true, deleted: deleted.length, failed, message: `Hard-deleted ${deleted.length} user(s).` });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error." });
  }
}
