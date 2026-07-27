import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map((c) => escapeCsvField(c)).join(",")).join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Método no permitido." });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anonKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      res.status(503).json({
        error: "Faltan variables SUPABASE en el servidor.",
        code: "server_config",
        missing: [
          !supabaseUrl && "SUPABASE_URL",
          !anonKey && "SUPABASE_ANON_KEY",
          !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
        ].filter(Boolean),
      });
      return;
    }

    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "No autenticado." });
      return;
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authData.user) {
      res.status(401).json({ error: "Sesión inválida." });
      return;
    }

    const { data: adminProfile, error: profileErr } = await userClient
      .from("habitus_profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileErr || !adminProfile?.is_admin) {
      res.status(403).json({ error: "Solo administradores pueden exportar usuarios." });
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    type AuthUser = { id: string; email?: string };
    const authUsers: AuthUser[] = [];
    let page = 1;
    while (page <= 50) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      authUsers.push(...(data.users as AuthUser[]));
      if (data.users.length < 1000) break;
      page += 1;
    }

    const { data: profiles, error: profilesErr } = await adminClient
      .from("habitus_profiles")
      .select(
        "id, display_name, account_role, role_title, bio_quote, avatar_url, slug, is_discoverable, identity_status, birth_date",
      );

    if (profilesErr) {
      res.status(500).json({ error: profilesErr.message });
      return;
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    const { data: tagRows, error: tagsErr } = await adminClient
      .from("habitus_profile_tags")
      .select("profile_id, tag");

    if (tagsErr) {
      res.status(500).json({ error: tagsErr.message });
      return;
    }

    const tagsByProfile = new Map<string, string[]>();
    for (const row of tagRows ?? []) {
      const pid = row.profile_id as string;
      const list = tagsByProfile.get(pid) ?? [];
      list.push(row.tag as string);
      tagsByProfile.set(pid, list);
    }

    const headers = [
      "email",
      "password",
      "display_name",
      "account_role",
      "role_title",
      "bio_quote",
      "avatar_url",
      "slug",
      "tags",
      "is_discoverable",
      "identity_status",
      "birth_date",
    ];

    const rows: string[][] = [headers];

    for (const u of authUsers) {
      if (!u.email) continue;
      const p = profileMap.get(u.id);
      if (!p) continue;
      rows.push([
        u.email,
        "",
        (p.display_name as string) ?? "",
        (p.account_role as string) ?? "",
        (p.role_title as string) ?? "",
        (p.bio_quote as string) ?? "",
        (p.avatar_url as string) ?? "",
        (p.slug as string) ?? "",
        (tagsByProfile.get(u.id) ?? []).join("|"),
        p.is_discoverable ? "true" : "false",
        (p.identity_status as string) ?? "none",
        p.birth_date ? String(p.birth_date).slice(0, 10) : "",
      ]);
    }

    const csv = "\uFEFF" + rowsToCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="habitus-usuarios-export.csv"');
    res.status(200).send(csv);
  } catch (e) {
    console.error("[export-users]", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Error interno del servidor.",
    });
  }
}
