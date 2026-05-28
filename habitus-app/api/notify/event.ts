import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type NotifyPayload = {
  type: string;
  profileIds: string[];
  title: string;
  body: string;
  entityId?: string;
  deepLink?: string;
  channels?: ("push" | "email" | "in_app")[];
  data?: Record<string, string>;
  idempotencyKey?: string;
};

type NotificationPrefs = {
  push_enabled: boolean;
  email_enabled: boolean;
  email_messages: boolean;
  email_applications: boolean;
  email_groups: boolean;
};

const SITE_ORIGIN =
  process.env.VITE_SITE_URL ??
  process.env.SITE_URL ??
  "https://www.moonsharedliving.com";

function adminClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function emailAllowedForType(type: string, prefs: NotificationPrefs): boolean {
  if (!prefs.email_enabled) return false;
  if (type === "new_message") return prefs.email_messages;
  if (
    type === "application_submitted" ||
    type === "application_status_changed" ||
    type === "lease_pending_signature"
  ) {
    return prefs.email_applications;
  }
  if (
    type === "group_join_request" ||
    type === "group_member_accepted" ||
    type === "group_member_rejected" ||
    type === "listing_access_granted"
  ) {
    return prefs.email_groups;
  }
  if (type === "expense_added") return false;
  return prefs.email_enabled;
}

async function resolveEmail(admin: SupabaseClient, profileId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(profileId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function loadPrefs(admin: SupabaseClient, profileId: string): Promise<NotificationPrefs> {
  const { data } = await admin
    .from("habitus_notification_preferences")
    .select("push_enabled, email_enabled, email_messages, email_applications, email_groups")
    .eq("profile_id", profileId)
    .maybeSingle();

  return {
    push_enabled: data?.push_enabled !== false,
    email_enabled: data?.email_enabled !== false,
    email_messages: data?.email_messages !== false,
    email_applications: data?.email_applications !== false,
    email_groups: data?.email_groups !== false,
  };
}

async function persistInApp(
  admin: SupabaseClient,
  profileId: string,
  payload: NotifyPayload,
): Promise<boolean> {
  const row = {
    profile_id: profileId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: {
      ...(payload.data ?? {}),
      ...(payload.deepLink ? { deepLink: payload.deepLink } : {}),
    },
    entity_id: payload.entityId ?? null,
    idempotency_key: payload.idempotencyKey ?? null,
  };

  const { error } = await admin.from("habitus_notifications").insert(row);
  if (error?.code === "23505") return false;
  if (error) {
    console.error("[notify] in-app insert", error.message);
    return false;
  }
  return true;
}

async function sendOneSignal(
  profileIds: string[],
  title: string,
  body: string,
  deepLink?: string,
): Promise<boolean> {
  const appId = process.env.ONESIGNAL_APP_ID ?? process.env.VITE_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey || !profileIds.length) return false;

  const url = deepLink
    ? deepLink.startsWith("http")
      ? deepLink
      : `${SITE_ORIGIN.replace(/\/$/, "")}${deepLink.startsWith("/") ? deepLink : `/${deepLink}`}`
    : SITE_ORIGIN;

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: profileIds },
      target_channel: "push",
      headings: { en: title, es: title },
      contents: { en: body, es: body },
      url,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[notify] OneSignal", res.status, text);
    return false;
  }
  return true;
}

function buildEmailHtml(title: string, body: string, ctaUrl: string, ctaLabel: string): string {
  return `<!DOCTYPE html><html lang="es"><body style="font-family:system-ui,sans-serif;background:#fafaf9;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e7e5e4">
<p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;margin:0 0 8px">: moon shared living</p>
<h1 style="font-size:22px;color:#0c0a09;margin:0 0 12px">${title}</h1>
<p style="font-size:16px;line-height:1.5;color:#57534e;margin:0 0 24px">${body}</p>
<a href="${ctaUrl}" style="display:inline-block;background:#0c0a09;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">${ctaLabel}</a>
<p style="font-size:12px;color:#a8a29e;margin:24px 0 0">Email transaccional de moonsharedliving.com. Gestiona preferencias en tu perfil.</p>
</div></body></html>`;
}

async function sendBrevo(
  toEmail: string,
  title: string,
  body: string,
  deepLink?: string,
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "hello@moonsharedliving.com";
  const senderName = process.env.BREVO_SENDER_NAME ?? ": moon shared living";
  if (!apiKey) return false;

  const ctaUrl = deepLink
    ? deepLink.startsWith("http")
      ? deepLink
      : `${SITE_ORIGIN.replace(/\/$/, "")}${deepLink.startsWith("/") ? deepLink : `/${deepLink}`}`
    : SITE_ORIGIN;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: toEmail }],
      subject: title,
      htmlContent: buildEmailHtml(title, body, ctaUrl, "Abrir en : moon"),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[notify] Brevo", res.status, text);
    return false;
  }
  return true;
}

async function processNotificationEvent(payload: NotifyPayload): Promise<{
  delivered: number;
  skipped: number;
}> {
  const admin = adminClient();
  if (!admin) {
    console.error("[notify] missing SUPABASE_SERVICE_ROLE_KEY");
    return { delivered: 0, skipped: payload.profileIds.length };
  }

  const channels = payload.channels ?? ["push", "email", "in_app"];
  let delivered = 0;
  let skipped = 0;

  for (const profileId of [...new Set(payload.profileIds)]) {
    const prefs = await loadPrefs(admin, profileId);
    let sentAny = false;

    if (channels.includes("in_app")) {
      const ok = await persistInApp(admin, profileId, payload);
      if (ok) sentAny = true;
    }

    if (channels.includes("push") && prefs.push_enabled) {
      const ok = await sendOneSignal([profileId], payload.title, payload.body, payload.deepLink);
      if (ok) sentAny = true;
    }

    if (channels.includes("email") && emailAllowedForType(payload.type, prefs)) {
      const email = await resolveEmail(admin, profileId);
      if (email) {
        const ok = await sendBrevo(email, payload.title, payload.body, payload.deepLink);
        if (ok) sentAny = true;
      }
    }

    if (sentAny) delivered += 1;
    else skipped += 1;
  }

  return { delivered, skipped };
}

function validateNotifyAuth(req: {
  headers: { authorization?: string; "x-notify-secret"?: string };
}): { ok: boolean; error?: string } {
  const secret = process.env.NOTIFY_INTERNAL_SECRET;
  const headerSecret = req.headers["x-notify-secret"];
  if (secret && headerSecret === secret) {
    return { ok: true };
  }

  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { ok: false, error: "No autenticado" };
  }

  return { ok: true };
}

async function resolveAuthUserId(token: string): Promise<string | null> {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = validateNotifyAuth({
    headers: {
      authorization: req.headers.authorization,
      "x-notify-secret": req.headers["x-notify-secret"] as string | undefined,
    },
  });

  if (!auth.ok) {
    return res.status(401).json({ error: auth.error ?? "No autenticado" });
  }

  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const secretOk =
    process.env.NOTIFY_INTERNAL_SECRET &&
    req.headers["x-notify-secret"] === process.env.NOTIFY_INTERNAL_SECRET;

  if (!secretOk) {
    const callerId = token ? await resolveAuthUserId(token) : null;
    if (!callerId) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
  }

  const body = req.body as NotifyPayload;

  if (!body?.type || !body.profileIds?.length || !body.title || !body.body) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  if (body.profileIds.length > 20) {
    return res.status(400).json({ error: "Too many recipients" });
  }

  try {
    const result = await processNotificationEvent(body);
    return res.status(202).json({ queued: true, ...result });
  } catch (e) {
    console.error("[notify/event]", e);
    return res.status(500).json({ error: "Notification pipeline failed" });
  }
}
