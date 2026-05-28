import { isValidCityZone, normalizeCitySlug, normalizeZoneSlug } from "../data/locations";
import { getSupabase } from "../client";
import { slugify } from "../lib/slug";
import {
  pickCsvField,
  USER_CSV_FIELD_ALIASES,
  validateUserCsvRecords,
} from "../lib/csvFieldAliases";
import type { AccountRoleSlug, IdentityStatus } from "../types/models";

export type AdminImportRowResult = {
  row: number;
  label: string;
  ok: boolean;
  message: string;
};

export type AdminImportSummary = {
  total: number;
  success: number;
  failed: number;
  results: AdminImportRowResult[];
};

export type AdminUserCsvRow = {
  email: string;
  password: string;
  display_name: string;
  account_role: AccountRoleSlug;
  role_title?: string;
  bio_quote?: string;
  avatar_url?: string;
  slug?: string;
  tags?: string;
  is_discoverable?: string;
  identity_status?: IdentityStatus;
  birth_date?: string;
};

export type AdminListingCsvRow = {
  owner_email: string;
  host_email?: string;
  name: string;
  slug?: string;
  location?: string;
  city?: string;
  price_monthly?: string;
  currency?: string;
  category_slug?: string;
  room_type?: string;
  description?: string;
  cover_image_url?: string;
  status?: string;
  visibility?: string;
  available_from?: string;
  listing_conditions?: string;
};

const VALID_ROLES: AccountRoleSlug[] = ["inquilino", "anfitrion", "propietario", "agencia"];
const VALID_IDENTITY: IdentityStatus[] = ["none", "pending", "verified"];
const VALID_STATUS = new Set(["draft", "published", "archived"]);
const VALID_VISIBILITY = new Set(["public", "private"]);
const VALID_CATEGORY = new Set(["habitacion", "piso-grupo"]);

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const v = value.trim().toLowerCase();
  if (["true", "1", "yes", "si", "sí"].includes(v)) return true;
  if (["false", "0", "no"].includes(v)) return false;
  return fallback;
}

function parseTags(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(/[|;]/).map((t) => t.trim()).filter(Boolean))];
}

export async function exportUsersCsv(accessToken: string, apiBase = ""): Promise<void> {
  const res = await fetch(`${apiBase}/api/admin/export-users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    if (payload.code === "server_config") {
      throw new Error(payload.error ?? "Configuración del servidor incompleta.");
    }
    throw new Error(payload.error ?? `Error HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "habitus-usuarios-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export { validateUserCsvRecords };

export type AdminImportHealth = {
  importUsersReady: boolean;
  missing: string[];
};

export async function fetchAdminImportHealth(apiBase = ""): Promise<AdminImportHealth> {
  const res = await fetch(`${apiBase}/api/admin/health`);
  const payload = (await res.json().catch(() => ({}))) as Partial<AdminImportHealth>;
  return {
    importUsersReady: payload.importUsersReady === true,
    missing: payload.missing ?? [],
  };
}

export async function adminResolveProfileIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_admin_profile_id_by_email", {
    p_email: email.trim(),
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function importUsersFromCsv(
  rows: AdminUserCsvRow[],
  accessToken: string,
  apiBase = "",
): Promise<AdminImportSummary> {
  const results: AdminImportRowResult[] = [];
  let success = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = i + 2;
    const label = row.email || `Fila ${rowNum}`;

    if (!row.email?.includes("@")) {
      results.push({ row: rowNum, label, ok: false, message: "Email inválido." });
      continue;
    }
    if (row.password && row.password.length > 0 && row.password.length < 8) {
      results.push({ row: rowNum, label, ok: false, message: "Contraseña mínima 8 caracteres." });
      continue;
    }
    if (!row.display_name?.trim()) {
      results.push({ row: rowNum, label, ok: false, message: "Falta display_name." });
      continue;
    }
    if (!VALID_ROLES.includes(row.account_role)) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: "account_role debe ser inquilino, anfitrion, propietario u operador (slug legacy: agencia).",
      });
      continue;
    }

    const identity = (row.identity_status ?? "none") as IdentityStatus;
    if (row.identity_status && !VALID_IDENTITY.includes(identity)) {
      results.push({ row: rowNum, label, ok: false, message: "identity_status inválido." });
      continue;
    }

    try {
      const res = await fetch(`${apiBase}/api/admin/import-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user: {
            email: row.email.trim(),
            password: row.password?.trim() || undefined,
            display_name: row.display_name.trim(),
            account_role: row.account_role,
            role_title: row.role_title?.trim() || null,
            bio_quote: row.bio_quote?.trim() || null,
            avatar_url: row.avatar_url?.trim() || null,
            slug: row.slug?.trim() || null,
            tags: parseTags(row.tags),
            is_discoverable: parseBool(row.is_discoverable, row.account_role === "inquilino"),
            identity_status: identity,
            birth_date: row.birth_date?.trim() || null,
          },
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        updated?: boolean;
        code?: string;
        hint?: string;
      };
      if (!res.ok || payload.error) {
        const message =
          payload.code === "server_config" && payload.hint
            ? `${payload.error} ${payload.hint}`
            : payload.error ?? `Error HTTP ${res.status}`;
        results.push({
          row: rowNum,
          label,
          ok: false,
          message,
        });
        continue;
      }

      success += 1;
      results.push({
        row: rowNum,
        label,
        ok: true,
        message: payload.updated ? "Perfil actualizado." : "Usuario creado.",
      });
    } catch (e) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: e instanceof Error ? e.message : "Error de red.",
      });
    }
  }

  return { total: rows.length, success, failed: rows.length - success, results };
}

async function fetchCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await getSupabase().from("habitus_categories").select("id, slug");
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.slug, row.id);
  }
  return map;
}

async function ensureUniqueListingSlug(base: string): Promise<string> {
  let slug = slugify(base) || "espacio";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data } = await getSupabase()
      .from("habitus_listings")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate.slice(0, 80);
  }
  return `${slug}-${Date.now().toString(36)}`.slice(0, 80);
}

export async function importListingsFromCsv(
  rows: AdminListingCsvRow[],
): Promise<AdminImportSummary> {
  const categories = await fetchCategoryMap();
  const results: AdminImportRowResult[] = [];
  let success = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = i + 2;
    const label = row.name?.trim() || row.slug?.trim() || `Fila ${rowNum}`;

    if (!row.owner_email?.includes("@")) {
      results.push({ row: rowNum, label, ok: false, message: "owner_email inválido." });
      continue;
    }
    if (!row.name?.trim()) {
      results.push({ row: rowNum, label, ok: false, message: "Falta name." });
      continue;
    }

    const status = (row.status?.trim().toLowerCase() || "draft") as
      | "draft"
      | "published"
      | "archived";
    if (!VALID_STATUS.has(status)) {
      results.push({ row: rowNum, label, ok: false, message: "status inválido." });
      continue;
    }

    const visibility = (row.visibility?.trim().toLowerCase() || "public") as "public" | "private";
    if (!VALID_VISIBILITY.has(visibility)) {
      results.push({ row: rowNum, label, ok: false, message: "visibility inválido." });
      continue;
    }

    const categorySlug = (row.category_slug?.trim().toLowerCase() || "habitacion") as string;
    if (!VALID_CATEGORY.has(categorySlug)) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: "category_slug debe ser habitacion o piso-grupo.",
      });
      continue;
    }

    const categoryId = categories.get(categorySlug) ?? null;
    if (!categoryId) {
      results.push({ row: rowNum, label, ok: false, message: "Categoría no encontrada en BD." });
      continue;
    }

    const locationRaw = row.location?.trim() ?? "";
    const cityRaw = row.city?.trim() ?? "";
    const city = normalizeCitySlug(cityRaw);
    const location = city ? normalizeZoneSlug(city, locationRaw) : normalizeZoneSlug("", locationRaw);
    if (status === "published" && (!location || !city)) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: "Publicado requiere city (slug) y location (slug de zona).",
      });
      continue;
    }
    if (cityRaw && !city) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: "city debe ser barcelona, madrid, valencia, sevilla o granada.",
      });
      continue;
    }
    if (locationRaw && city && !isValidCityZone(city, location)) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: `location (zona) no válida para ${city}.`,
      });
      continue;
    }

    const priceRaw = row.price_monthly?.trim() || "0";
    const priceMonthly = Number(priceRaw.replace(",", "."));
    if (!Number.isFinite(priceMonthly) || priceMonthly < 0) {
      results.push({ row: rowNum, label, ok: false, message: "price_monthly inválido." });
      continue;
    }

    try {
      const ownerId = await adminResolveProfileIdByEmail(row.owner_email);
      if (!ownerId) {
        results.push({
          row: rowNum,
          label,
          ok: false,
          message: `No hay usuario con email ${row.owner_email}.`,
        });
        continue;
      }

      let hostId: string | null = null;
      if (row.host_email?.trim()) {
        hostId = await adminResolveProfileIdByEmail(row.host_email);
        if (!hostId) {
          results.push({
            row: rowNum,
            label,
            ok: false,
            message: `No hay usuario con email ${row.host_email}.`,
          });
          continue;
        }
      }

      const slugBase = row.slug?.trim() || row.name;
      const slug = await ensureUniqueListingSlug(slugBase);

      const { data: inserted, error } = await getSupabase()
        .from("habitus_listings")
        .insert({
          owner_profile_id: ownerId,
          host_profile_id: hostId,
          slug,
          name: row.name.trim(),
          location,
          city: city || null,
          price_monthly: priceMonthly,
          currency: (row.currency?.trim().toUpperCase() || "EUR").slice(0, 3),
          category_id: categoryId,
          room_type: row.room_type?.trim() || null,
          description: row.description?.trim() || null,
          cover_image_url: row.cover_image_url?.trim() || null,
          status,
          visibility,
          available_from: row.available_from?.trim() || null,
          listing_conditions: row.listing_conditions?.trim() || null,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        results.push({ row: rowNum, label, ok: false, message: error?.message ?? "Insert falló." });
        continue;
      }

      if (hostId && categorySlug === "piso-grupo") {
        const { data: session } = await getSupabase().auth.getSession();
        const assignedBy = session.session?.user?.id;
        if (assignedBy) {
          await getSupabase().from("habitus_listing_assignments").insert({
            listing_id: inserted.id,
            host_profile_id: hostId,
            assigned_by: assignedBy,
          });
        }
      }

      success += 1;
      results.push({ row: rowNum, label, ok: true, message: `Importado (${slug}).` });
    } catch (e) {
      results.push({
        row: rowNum,
        label,
        ok: false,
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  return { total: rows.length, success, failed: rows.length - success, results };
}

/** Convierte registros CSV genéricos a filas tipadas de usuario (soporta alias de columnas). */
export function mapUserCsvRecords(records: Record<string, string>[]): AdminUserCsvRow[] {
  return records.map((r) => ({
    email: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.email),
    password: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.password),
    display_name: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.display_name),
    account_role: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.account_role) as AccountRoleSlug,
    role_title: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.role_title) || undefined,
    bio_quote: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.bio_quote) || undefined,
    avatar_url: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.avatar_url) || undefined,
    slug: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.slug) || undefined,
    tags: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.tags) || undefined,
    is_discoverable: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.is_discoverable) || undefined,
    identity_status:
      (pickCsvField(r, ...USER_CSV_FIELD_ALIASES.identity_status) as IdentityStatus | "") ||
      undefined,
    birth_date: pickCsvField(r, ...USER_CSV_FIELD_ALIASES.birth_date) || undefined,
  }));
}

/** Convierte registros CSV genéricos a filas tipadas de listing. */
export function mapListingCsvRecords(records: Record<string, string>[]): AdminListingCsvRow[] {
  return records.map((r) => ({
    owner_email: r.owner_email ?? "",
    host_email: r.host_email,
    name: r.name ?? "",
    slug: r.slug,
    location: r.location,
    city: r.city,
    price_monthly: r.price_monthly,
    currency: r.currency,
    category_slug: r.category_slug,
    room_type: r.room_type,
    description: r.description,
    cover_image_url: r.cover_image_url,
    status: r.status,
    visibility: r.visibility,
    available_from: r.available_from,
    listing_conditions: r.listing_conditions,
  }));
}
