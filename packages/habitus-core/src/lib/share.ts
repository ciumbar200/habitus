const DEFAULT_SITE_ORIGIN = "https://www.moonsharedliving.com";

export function resolveSiteOrigin(explicit?: string | null): string {
  if (explicit?.trim()) return explicit.trim().replace(/\/$/, "");

  // Browser environment
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return DEFAULT_SITE_ORIGIN;
}

export function buildGroupInviteUrl(slug: string, siteOrigin?: string): string {
  return `${resolveSiteOrigin(siteOrigin)}/invitar/grupo/${encodeURIComponent(slug)}`;
}

export function buildReferralUrl(code: string, siteOrigin?: string): string {
  const origin = resolveSiteOrigin(siteOrigin);
  return `${origin}/access?signup=1&ref=${encodeURIComponent(code)}`;
}

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareLink(payload: SharePayload): Promise<"shared" | "copied" | "none"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch {
      /* usuario canceló o no disponible */
    }
  }
  const copied = await copyToClipboard(payload.url);
  return copied ? "copied" : "none";
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailShareUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function shareGroupInviteText(groupName: string, url: string): string {
  return `Únete a mi grupo «${groupName}» en : moon shared living: ${url}`;
}

export function shareReferralText(url: string): string {
  return `Te invito a : moon shared living. Regístrate con mi enlace y encuentra tu hogar compartido ideal: ${url}`;
}
