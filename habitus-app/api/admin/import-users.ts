import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type ImportUserBody = {
  user?: {
    email: string;
    password?: string;
    display_name: string;
    account_role: string;
    role_title?: string | null;
    bio_quote?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    tags?: string[];
    is_discoverable?: boolean;
    identity_status?: string;
    birth_date?: string | null;
  };
};

function slugFromName(name: string, userId: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "usuario";
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`.slice(0, 80);
}

function isDuplicateEmailError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("already") || m.includes("registered") || m.includes("exists");
}

function computeImportProfileScore(input: {
  display_name: string;
  avatar_url?: string | null;
  bio_quote?: string | null;
  role_title?: string | null;
  tags?: string[];
}): number {
  let score = 15;
  if (input.display_name.trim().length >= 2) score += 20;
  if (input.avatar_url?.trim()) score += 30;
  if ((input.bio_quote?.trim().length ?? 0) >= 30) score += 20;
  if (input.role_title?.trim()) score += 10;
  if ((input.tags?.length ?? 0) >= 2) score += 5;
  return Math.min(100, score);
}

async function findUserIdByEmail(
  adminClient: SupabaseClient,
  email: string,
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  while (page <= 50) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 1000) break;
    page += 1;
  }
  return null;
}

async function syncProfileTags(
  adminClient: SupabaseClient,
  userId: string,
  tags: string[],
): Promise<string | null> {
  if (!tags.length) return null;
  await adminClient.from("habitus_profile_tags").delete().eq("profile_id", userId);
  const { error } = await adminClient.from("habitus_profile_tags").insert(
    tags.map((tag) => ({ profile_id: userId, tag })),
  );
  return error?.message ?? null;
}

function readImportBody(req: VercelRequest): ImportUserBody | null {
  const raw = req.body;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ImportUserBody;
    } catch {
      return null;
    }
  }
  return raw as ImportUserBody;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "POST") {
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
        hint: "Añade SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings → Environment Variables). La clave service_role está en Supabase → Project Settings → API.",
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
      res.status(403).json({ error: "Solo administradores pueden importar usuarios." });
      return;
    }

    const body = readImportBody(req);
    const user = body?.user;
    if (!user?.email || !user.display_name || !user.account_role) {
      res.status(400).json({ error: "Faltan campos obligatorios del usuario." });
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string;
    let createdNew = false;

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: user.email.trim(),
      password: user.password || `Import-${Math.random().toString(36).slice(2, 10)}!9`,
      email_confirm: true,
      user_metadata: {
        full_name: user.display_name.trim(),
        account_role: user.account_role,
        avatar_url: user.avatar_url?.trim() || undefined,
        picture: user.avatar_url?.trim() || undefined,
      },
    });

    if (createErr || !created.user) {
      if (!createErr?.message || !isDuplicateEmailError(createErr.message)) {
        res.status(400).json({ error: createErr?.message ?? "No se pudo crear el usuario." });
        return;
      }

      const existingId = await findUserIdByEmail(adminClient, user.email);
      if (!existingId) {
        res.status(400).json({ error: "El email ya existe pero no se pudo localizar el usuario." });
        return;
      }

      userId = existingId;
      if (user.password && user.password.length >= 8) {
        const { error: pwdErr } = await adminClient.auth.admin.updateUserById(userId, {
          password: user.password,
        });
        if (pwdErr) {
          res.status(400).json({ error: pwdErr.message });
          return;
        }
      }
    } else {
      userId = created.user.id;
      createdNew = true;
    }

    const identity = user.identity_status ?? "none";
    const tags = user.tags ?? [];
    const profilePayload: Record<string, unknown> = {
      id: userId,
      display_name: user.display_name.trim(),
      account_role: user.account_role,
      role_title: user.role_title?.trim() || null,
      bio_quote: user.bio_quote?.trim() || null,
      avatar_url: user.avatar_url?.trim() || null,
      is_discoverable: user.is_discoverable ?? user.account_role === "inquilino",
      identity_status: identity,
      birth_date: user.birth_date?.trim() || null,
      slug: user.slug?.trim() || slugFromName(user.display_name, userId),
      profile_score: computeImportProfileScore({
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio_quote: user.bio_quote,
        role_title: user.role_title,
        tags,
      }),
      updated_at: new Date().toISOString(),
    };

    if (identity === "verified") {
      profilePayload.identity_verified_at = new Date().toISOString();
    }

    const { error: upsertErr } = await adminClient.from("habitus_profiles").upsert(profilePayload);

    if (upsertErr) {
      res.status(400).json({ error: upsertErr.message });
      return;
    }

    const tagsErr = await syncProfileTags(adminClient, userId, tags);
    if (tagsErr) {
      res.status(400).json({ error: tagsErr });
      return;
    }

    res.status(200).json({
      ok: true,
      userId,
      updated: !createdNew,
    });
  } catch (e) {
    console.error("[import-users]", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Error interno del servidor.",
    });
  }
}
