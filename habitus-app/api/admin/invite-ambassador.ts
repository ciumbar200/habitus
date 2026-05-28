import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function generateTempPassword(): string {
  return "Moon" + Math.random().toString(36).slice(2, 10) + "!2026";
}

function slugFromName(name: string, userId: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "embajador";
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`.slice(0, 80);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Método no permitido." });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      res.status(503).json({ error: "Faltan variables SUPABASE en el servidor.", code: "server_config" });
      return;
    }

    // Verificar que el llamante es admin
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: "Token de autenticación requerido." });
      return;
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      res.status(401).json({ error: "No autenticado." });
      return;
    }

    const { data: callerProfile } = await anonClient
      .from("habitus_profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .single();
    if (!callerProfile?.is_admin) {
      res.status(403).json({ error: "Acceso solo para administradores." });
      return;
    }

    // Parsear body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const email: string | undefined = body?.email?.trim();
    const name: string | undefined = body?.name?.trim() || undefined;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Email inválido." });
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Buscar si el usuario ya existe
    let userId: string | null = null;
    const { data: existingList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = existingList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
    } else {
      // Crear usuario nuevo
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: generateTempPassword(),
        email_confirm: true,
        user_metadata: { display_name: name ?? email.split("@")[0] },
      });
      if (createErr || !created?.user) {
        res.status(500).json({ error: createErr?.message ?? "No se pudo crear el usuario." });
        return;
      }
      userId = created.user.id;

      // Esperar a que el trigger cree el perfil (max 2s)
      await new Promise((r) => setTimeout(r, 800));
    }

    // Asignar rol embajador y completar onboarding
    const displayName = name ?? email.split("@")[0];
    const slug = slugFromName(displayName, userId);

    await adminClient
      .from("habitus_profiles")
      .update({
        account_role: "embajador",
        onboarding_completed_at: new Date().toISOString(),
        display_name: displayName,
        slug,
      })
      .eq("id", userId);

    // Generar código de referido
    const { data: codeData } = await adminClient.rpc("habitus_get_or_create_referral_code", {
      p_profile_id: userId,
    });

    res.status(200).json({
      ok: true,
      userId,
      email,
      referralCode: codeData ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    res.status(500).json({ error: msg });
  }
}
