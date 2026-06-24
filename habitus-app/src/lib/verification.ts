import { supabase } from "./supabase";

export type VerificationStatus =
  | "unverified" | "basic_pending" | "basic_ai_reviewed" | "basic_manual_review"
  | "basic_approved" | "basic_rejected" | "stripe_pending" | "stripe_verified"
  | "stripe_failed" | "advanced_required";

export type VerificationCheck = {
  id: string;
  verification_type: "basic_trust" | "stripe_identity";
  status: VerificationStatus;
  public_badge: "none" | "basic_trust" | "identity_verified";
  liveness_code: string | null;
  rejection_reason: string | null;
  created_at: string;
};

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sesión no disponible.");
  return data.session.access_token;
}

export async function fetchMyVerification(): Promise<VerificationCheck | null> {
  const { data, error } = await supabase.from("verification_checks")
    .select("id, verification_type, status, public_badge, liveness_code, rejection_reason, created_at")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as VerificationCheck | null;
}

export async function startBasicVerification(): Promise<VerificationCheck> {
  const { data, error } = await supabase.rpc("habitus_start_basic_verification", { p_consent_version: "2026-06-07" });
  if (error) throw error;
  return data as VerificationCheck;
}

function extension(file: File): string {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function upload(checkId: string, kind: string, file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No autenticado.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Cada archivo debe pesar menos de 10 MB.");
  const path = `${userData.user.id}/${checkId}/${kind}-${crypto.randomUUID()}.${extension(file)}`;
  const { error } = await supabase.storage.from("verification-documents").upload(path, file, {
    contentType: file.type, upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function submitBasicVerification(checkId: string, files: {
  documentFront: File; documentBack?: File | null; selfie: File; selfieCode: File;
}): Promise<void> {
  const uploaded: string[] = [];
  try {
    const front = await upload(checkId, "document-front", files.documentFront); uploaded.push(front);
    const back = files.documentBack ? await upload(checkId, "document-back", files.documentBack) : null;
    if (back) uploaded.push(back);
    const selfie = await upload(checkId, "selfie", files.selfie); uploaded.push(selfie);
    const selfieCode = await upload(checkId, "selfie-code", files.selfieCode); uploaded.push(selfieCode);
    const { error } = await supabase.rpc("habitus_submit_basic_verification", {
      p_check_id: checkId, p_document_front_path: front, p_document_back_path: back,
      p_selfie_path: selfie, p_selfie_code_path: selfieCode,
    });
    if (error) throw error;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from("verification-documents").remove(uploaded);
    throw error;
  }

  // La IA es opcional: una caída del proveedor nunca invalida el envío manual.
  try {
    const token = await accessToken();
    await fetch("/api/verification/precheck", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ checkId }),
    });
  } catch {
    // El check ya está en basic_manual_review y será visible para administración.
  }
}

export async function startStripeIdentity(): Promise<void> {
  const token = await accessToken();
  const response = await fetch("/api/stripe/identity/create-session", {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json() as { url?: string; error?: string };
  if (!response.ok || !payload.url) throw new Error(payload.error ?? "No se pudo iniciar Stripe Identity.");
  window.location.assign(payload.url);
}

export async function adminFetchVerifications(id?: string) {
  const token = await accessToken();
  const response = await fetch(`/api/admin/verifications${id ? `?id=${encodeURIComponent(id)}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar las verificaciones.");
  return payload.checks as Array<Record<string, unknown>>;
}

export async function adminReviewVerification(checkId: string, action: string, reason?: string) {
  const token = await accessToken();
  const response = await fetch("/api/admin/verifications", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ checkId, action, reason }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "No se pudo actualizar la verificación.");
}
