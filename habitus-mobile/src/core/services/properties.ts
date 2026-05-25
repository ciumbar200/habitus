import { getSupabase } from "../client";
import { currencySymbol } from "../lib/format";
import { imageUrlOrPlaceholder } from "../lib/media";
import { computeListingCompatibility, resolveQuizAnswers } from "./compatibility";
import type { CompatQuizAnswers } from "../types/compatibility";
import type {
  Category,
  CompatibilityMode,
  IdentityStatus,
  Property,
  PropertyHost,
} from "../types/models";

type ListingRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string | null;
  price_monthly: number;
  currency: string;
  compatibility_score: number | null;
  cover_image_url: string | null;
  available_from: string | null;
  room_type: string | null;
  description: string | null;
  host_profile_id: string | null;
  owner_profile_id: string | null;
  visibility: string | null;
  listing_conditions: string | null;
  property_verification_status: string | null;
  habitus_listing_amenities: { icon: string; label: string; sort_order: number }[];
  habitus_categories: { slug: string; label: string } | null;
};

type HostRow = {
  id: string;
  slug: string | null;
  display_name: string;
  avatar_url: string | null;
  role_title: string | null;
  identity_status: string | null;
};

function mapHost(row: HostRow | undefined): PropertyHost | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.display_name,
    image: imageUrlOrPlaceholder(row.avatar_url),
    roleTitle: row.role_title,
    identityStatus: (row.identity_status ?? "none") as IdentityStatus,
  };
}

function compatibilityModeFor(row: ListingRow): CompatibilityMode {
  if (row.host_profile_id) return "host";
  return "owner_only";
}

function mapProperty(
  row: ListingRow,
  tenantQuiz?: CompatQuizAnswers,
  hostQuiz?: CompatQuizAnswers,
  host?: PropertyHost | null,
): Property {
  const amenities = [...(row.habitus_listing_amenities ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({ icon: a.icon, label: a.label }));

  const mode = compatibilityModeFor(row);
  let compatibility: number | null = row.compatibility_score;
  let compatibilityResult = undefined;

  if (mode === "host" && tenantQuiz && Object.keys(tenantQuiz).length > 0) {
    const hostAnswers = hostQuiz ?? {};
    const result = computeListingCompatibility(tenantQuiz, hostAnswers, {
      city: row.city,
      priceMonthly: Number(row.price_monthly),
    });
    compatibility = result.overall;
    compatibilityResult = result;
  } else if (mode === "owner_only") {
    compatibility = null;
    compatibilityResult = undefined;
  }

  return {
    id: row.slug,
    slug: row.slug,
    uuid: row.id,
    name: row.name,
    location: row.location,
    city: row.city,
    price: Number(row.price_monthly),
    currency: row.currency,
    currencySymbol: currencySymbol(row.currency),
    compatibility,
    compatibilityResult,
    compatibilityMode: mode,
    image: imageUrlOrPlaceholder(row.cover_image_url),
    amenities,
    availableFrom: row.available_from,
    roomType: row.room_type,
    description: row.description,
    categorySlug: row.habitus_categories?.slug ?? null,
    categoryLabel: row.habitus_categories?.label ?? null,
    visibility: (row.visibility === "private" ? "private" : "public") as Property["visibility"],
    host: host ?? null,
    listingConditions: row.listing_conditions ?? null,
    propertyVerificationStatus: (row.property_verification_status ?? "none") as IdentityStatus,
    ownerIdentityStatus: null,
  };
}

const listingSelect = `id, slug, name, location, city, price_monthly, currency, compatibility_score, cover_image_url,
       available_from, room_type, description, host_profile_id, owner_profile_id, visibility,
       listing_conditions, property_verification_status,
       habitus_listing_amenities (icon, label, sort_order),
       habitus_categories (slug, label)`;

async function loadOwnerIdentities(rows: ListingRow[]): Promise<Map<string, IdentityStatus>> {
  const ownerIds = [...new Set(rows.map((r) => r.owner_profile_id).filter(Boolean))] as string[];
  const map = new Map<string, IdentityStatus>();
  if (!ownerIds.length) return map;

  const { data } = await getSupabase()
    .from("habitus_profiles")
    .select("id, identity_status")
    .in("id", ownerIds);

  for (const o of data ?? []) {
    map.set(o.id, (o.identity_status ?? "none") as IdentityStatus);
  }
  return map;
}

function applyOwnerIdentity(
  property: Property,
  row: ListingRow,
  ownerMap: Map<string, IdentityStatus>,
): Property {
  if (!row.owner_profile_id) return property;
  return {
    ...property,
    ownerIdentityStatus: ownerMap.get(row.owner_profile_id) ?? null,
  };
}

async function loadHosts(rows: ListingRow[]): Promise<Map<string, PropertyHost>> {
  const hostIds = [...new Set(rows.map((r) => r.host_profile_id).filter(Boolean))] as string[];
  const map = new Map<string, PropertyHost>();
  if (!hostIds.length) return map;

  const { data } = await getSupabase()
    .from("habitus_profiles")
    .select("id, slug, display_name, avatar_url, role_title, identity_status")
    .in("id", hostIds);

  for (const h of data ?? []) {
    const host = mapHost(h as HostRow);
    if (host) map.set(h.id, host);
  }
  return map;
}

async function loadHostQuizzes(
  rows: ListingRow[],
): Promise<Map<string, CompatQuizAnswers>> {
  const hostIds = [...new Set(rows.map((r) => r.host_profile_id).filter(Boolean))] as string[];
  if (hostIds.length === 0) return new Map();

  const { data } = await getSupabase()
    .from("habitus_profiles")
    .select("id, compat_quiz")
    .in("id", hostIds);

  const map = new Map<string, CompatQuizAnswers>();
  for (const h of data ?? []) {
    map.set(h.id, resolveQuizAnswers(h.compat_quiz as CompatQuizAnswers));
  }
  return map;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from("habitus_categories")
    .select("id, slug, label")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProperties(
  categorySlug?: string,
  tenantQuiz?: CompatQuizAnswers,
): Promise<Property[]> {
  let categoryId: string | undefined;
  if (categorySlug && categorySlug !== "all") {
    const { data: cat } = await getSupabase()
      .from("habitus_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    categoryId = cat?.id;
    if (!categoryId) return [];
  }

  let query = getSupabase()
    .from("habitus_listings")
    .select(listingSelect)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("name");

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as ListingRow[];
  const hostMap = await loadHosts(rows);
  const ownerMap = await loadOwnerIdentities(rows);
  const quizMap = tenantQuiz ? await loadHostQuizzes(rows) : new Map();

  return rows
    .map((row) =>
      applyOwnerIdentity(
        mapProperty(
          row,
          tenantQuiz,
          row.host_profile_id ? quizMap.get(row.host_profile_id) : undefined,
          row.host_profile_id ? hostMap.get(row.host_profile_id) ?? null : null,
        ),
        row,
        ownerMap,
      ),
    )
    .sort((a, b) => (b.compatibility ?? -1) - (a.compatibility ?? -1));
}

export async function fetchPropertyBySlug(
  slug: string,
  tenantQuiz?: CompatQuizAnswers,
): Promise<Property | null> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select(listingSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;

  let row = data as unknown as ListingRow | null;
  if (!row) {
    const { data: own } = await getSupabase()
      .from("habitus_listings")
      .select(listingSelect)
      .eq("slug", slug)
      .maybeSingle();
    row = own as unknown as ListingRow | null;
  }
  if (!row) return null;

  let hostQuiz: CompatQuizAnswers | undefined;
  let host: PropertyHost | null = null;
  if (row.host_profile_id) {
    const { data: hostRow } = await getSupabase()
      .from("habitus_profiles")
      .select("id, slug, display_name, avatar_url, role_title, identity_status, compat_quiz")
      .eq("id", row.host_profile_id)
      .maybeSingle();
    if (hostRow) {
      host = mapHost(hostRow as HostRow);
      hostQuiz = resolveQuizAnswers(hostRow.compat_quiz as CompatQuizAnswers);
    }
  }

  let ownerMap = new Map<string, IdentityStatus>();
  if (row.owner_profile_id) {
    const { data: ownerRow } = await getSupabase()
      .from("habitus_profiles")
      .select("id, identity_status")
      .eq("id", row.owner_profile_id)
      .maybeSingle();
    if (ownerRow) {
      ownerMap.set(ownerRow.id, (ownerRow.identity_status ?? "none") as IdentityStatus);
    }
  }

  return applyOwnerIdentity(mapProperty(row, tenantQuiz, hostQuiz, host), row, ownerMap);
}

export async function fetchListingsByOwner(ownerProfileId: string): Promise<Property[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select(listingSelect)
    .eq("owner_profile_id", ownerProfileId)
    .eq("status", "published")
    .order("name");

  if (error) throw error;
  const rows = (data ?? []) as unknown as ListingRow[];
  const ownerMap = await loadOwnerIdentities(rows);
  return rows.map((row) =>
    applyOwnerIdentity(mapProperty(row, undefined, undefined, null), row, ownerMap),
  );
}

export async function fetchListingsByHost(hostProfileId: string): Promise<Property[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select(listingSelect)
    .eq("host_profile_id", hostProfileId)
    .eq("status", "published")
    .order("name");

  if (error) throw error;
  const rows = (data ?? []) as unknown as ListingRow[];
  const hostMap = await loadHosts(rows);
  return rows.map((row) =>
    mapProperty(row, undefined, undefined, hostMap.get(hostProfileId) ?? null),
  );
}

export async function fetchPropertyImages(slug: string): Promise<{ url: string; alt: string }[]> {
  const { data: listing } = await getSupabase()
    .from("habitus_listings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!listing) return [];

  const { data, error } = await getSupabase()
    .from("habitus_listing_images")
    .select("image_url, alt_text, sort_order")
    .eq("listing_id", listing.id)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((img) => ({ url: img.image_url, alt: img.alt_text ?? "" }));
}

export async function getListingUuidBySlug(slug: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
