import { getSupabase } from "../client";
import { isValidCityZone, normalizeCitySlug, normalizeZoneSlug } from "../data/locations";
import type { AccountRoleSlug, PropertyVerificationStatus } from "../types/models";

export type ListingStatus = "draft" | "published" | "archived";

export type OwnerListing = {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  priceMonthly: number;
  currency: string;
  status: ListingStatus;
  coverImageUrl: string | null;
  roomType: string | null;
  description: string | null;
  hostProfileId: string | null;
  agencyClientName: string | null;
  categoryId: string | null;
  availableFrom: string | null;
  visibility: "public" | "private";
  listingConditions: string | null;
  propertyVerificationStatus: PropertyVerificationStatus;
  applicationCount?: number;
};

export type ListingFormInput = {
  name: string;
  slug: string;
  location: string;
  city: string;
  priceMonthly: number;
  currency: string;
  roomType: string;
  description: string;
  coverImageUrl: string;
  categoryId: string | null;
  availableFrom: string | null;
  status: ListingStatus;
  visibility: "public" | "private";
  hostProfileId: string | null;
  agencyClientName: string | null;
  listingConditions: string;
};

function normalizeListingFormInput(
  input: ListingFormInput,
): { input: ListingFormInput; error: string | null } {
  const city = normalizeCitySlug(input.city);
  const zone = normalizeZoneSlug(city, input.location);
  if (!city) {
    return { input, error: "Selecciona una ciudad válida." };
  }
  if (!zone || !isValidCityZone(city, zone)) {
    return { input, error: "Selecciona una zona válida." };
  }
  return {
    input: { ...input, city, location: zone },
    error: null,
  };
}

export async function fetchMyListings(
  profileId: string,
  role?: AccountRoleSlug,
): Promise<OwnerListing[]> {
  let query = getSupabase()
    .from("habitus_listings")
    .select(
      `id, slug, name, location, city, price_monthly, currency, status, cover_image_url,
       room_type, description, host_profile_id, agency_client_name, category_id, available_from, visibility,
       listing_conditions, property_verification_status`,
    );

  if (role === "anfitrion") {
    query = query.or(`owner_profile_id.eq.${profileId},host_profile_id.eq.${profileId}`);
  } else {
    query = query.eq("owner_profile_id", profileId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapListing);
}

export async function fetchListingForEdit(
  profileId: string,
  listingId: string,
): Promise<OwnerListing | null> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select(
      `id, slug, name, location, city, price_monthly, currency, status, cover_image_url,
       room_type, description, host_profile_id, agency_client_name, category_id, available_from, visibility,
       listing_conditions, property_verification_status`,
    )
    .eq("id", listingId)
    .or(`owner_profile_id.eq.${profileId},host_profile_id.eq.${profileId}`)
    .maybeSingle();

  if (error) throw error;
  return data ? mapListing(data) : null;
}

export async function createListing(
  ownerId: string,
  input: ListingFormInput,
  accountRole: AccountRoleSlug,
): Promise<{ id: string | null; error: string | null }> {
  const normalized = normalizeListingFormInput(input);
  if (normalized.error) return { id: null, error: normalized.error };
  input = normalized.input;

  const hostId =
    accountRole === "anfitrion"
      ? ownerId
      : null;

  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .insert({
      owner_profile_id: ownerId,
      slug: input.slug,
      name: input.name,
      location: input.location,
      city: input.city,
      price_monthly: input.priceMonthly,
      currency: input.currency,
      room_type: input.roomType,
      description: input.description,
      cover_image_url: input.coverImageUrl || null,
      category_id: input.categoryId,
      available_from: input.availableFrom,
      status: input.status,
      visibility: input.visibility,
      host_profile_id: hostId,
      agency_client_name: accountRole === "agencia" ? input.agencyClientName : null,
      listing_conditions: input.listingConditions.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { id: null, error: "Ya existe un anuncio con esa URL (slug)." };
    return { id: null, error: error.message };
  }
  return { id: data.id, error: null };
}

export async function updateListing(
  ownerId: string,
  listingId: string,
  input: ListingFormInput,
  accountRole: AccountRoleSlug,
): Promise<{ error: string | null }> {
  const normalized = normalizeListingFormInput(input);
  if (normalized.error) return { error: normalized.error };
  input = normalized.input;

  const hostId =
    accountRole === "anfitrion"
      ? ownerId
      : null;

  const baseUpdate = {
    slug: input.slug,
    name: input.name,
    location: input.location,
    city: input.city,
    price_monthly: input.priceMonthly,
    currency: input.currency,
    room_type: input.roomType,
    description: input.description,
    cover_image_url: input.coverImageUrl || null,
    category_id: input.categoryId,
    available_from: input.availableFrom,
    status: input.status,
    visibility: input.visibility,
    agency_client_name: accountRole === "agencia" ? input.agencyClientName : null,
    listing_conditions: input.listingConditions.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const updatePayload =
    accountRole === "anfitrion"
      ? { ...baseUpdate, host_profile_id: hostId }
      : baseUpdate;

  const { error } = await getSupabase()
    .from("habitus_listings")
    .update(updatePayload)
    .eq("id", listingId)
    .or(`owner_profile_id.eq.${ownerId},host_profile_id.eq.${ownerId}`);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteListing(
  ownerId: string,
  listingId: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_listings")
    .delete()
    .eq("id", listingId)
    .eq("owner_profile_id", ownerId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function insertListingImages(
  listingId: string,
  urls: string[],
): Promise<void> {
  if (!urls.length) return;
  const rows = urls.map((url, i) => ({
    listing_id: listingId,
    image_url: url,
    sort_order: i,
    alt_text: "",
  }));
  const { error } = await getSupabase().from("habitus_listing_images").insert(rows);
  if (error) throw error;
}

export async function fetchListingGalleryUrls(listingId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listing_images")
    .select("image_url, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((r) => r.image_url as string);
}

export async function replaceListingGallery(listingId: string, urls: string[]): Promise<void> {
  const { error: delErr } = await getSupabase()
    .from("habitus_listing_images")
    .delete()
    .eq("listing_id", listingId);
  if (delErr) throw delErr;
  if (urls.length) await insertListingImages(listingId, urls);
}

export async function fetchListingAmenitiesForEdit(listingId: string): Promise<{ icon: string; label: string }[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listing_amenities")
    .select("icon, label, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((r) => ({ icon: r.icon as string, label: r.label as string }));
}

export async function replaceListingAmenities(
  listingId: string,
  items: { icon: string; label: string }[],
): Promise<void> {
  const { error: delErr } = await getSupabase()
    .from("habitus_listing_amenities")
    .delete()
    .eq("listing_id", listingId);
  if (delErr) throw delErr;
  if (!items.length) return;
  const rows = items.map((a, i) => ({
    listing_id: listingId,
    icon: a.icon,
    label: a.label,
    sort_order: i,
  }));
  const { error } = await getSupabase().from("habitus_listing_amenities").insert(rows);
  if (error) throw error;
}

export async function fetchHosts(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select("id, display_name")
    .eq("account_role", "anfitrion")
    .order("display_name");

  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
}

function mapListing(row: Record<string, unknown>): OwnerListing {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    location: row.location as string,
    city: row.city as string,
    priceMonthly: Number(row.price_monthly),
    currency: row.currency as string,
    status: row.status as ListingStatus,
    coverImageUrl: (row.cover_image_url as string) ?? null,
    roomType: (row.room_type as string) ?? null,
    description: (row.description as string) ?? null,
    hostProfileId: (row.host_profile_id as string) ?? null,
    agencyClientName: (row.agency_client_name as string) ?? null,
    categoryId: (row.category_id as string) ?? null,
    availableFrom: (row.available_from as string) ?? null,
    visibility: (row.visibility === "private" ? "private" : "public") as OwnerListing["visibility"],
    listingConditions: (row.listing_conditions as string) ?? null,
    propertyVerificationStatus: (row.property_verification_status ?? "none") as PropertyVerificationStatus,
  };
}

export async function requestPropertyVerification(
  ownerId: string,
  listingId: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_listings")
    .update({
      property_verification_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .or(`owner_profile_id.eq.${ownerId},host_profile_id.eq.${ownerId}`);

  if (error) return { error: error.message };
  return { error: null };
}

/** Demo: simula verificación del inmueble completada. */
export async function completePropertyVerificationDemo(
  ownerId: string,
  listingId: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("habitus_listings")
    .update({
      property_verification_status: "verified",
      property_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .or(`owner_profile_id.eq.${ownerId},host_profile_id.eq.${ownerId}`);

  if (error) return { error: error.message };
  return { error: null };
}
