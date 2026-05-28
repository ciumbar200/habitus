import { getSupabase } from "../client";
import { applicationStatusLabel } from "../lib/format";
import { notifyApplicationStatusChanged } from "./notifications";
import type { OwnerListing, ListingStatus } from "./ownerListings";
import { fetchMyListings } from "./ownerListings";

export type ReviewApplication = {
  id: string;
  status: string;
  progressPercent: number;
  appliedAt: string | null;
  applicantName: string;
  applicantId: string;
  applicantSlug: string;
  listingName: string;
  listingId: string;
  listingSlug: string;
  listingVisibility: "public" | "private";
  groupId: string | null;
  groupName: string | null;
};

type ListingRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  price_monthly: number;
  currency: string;
  status: ListingStatus;
  cover_image_url: string | null;
  room_type: string | null;
  description: string | null;
  host_profile_id: string | null;
  agency_client_name: string | null;
  category_id: string | null;
  available_from: string | null;
  visibility: string | null;
  listing_conditions: string | null;
  property_verification_status: string | null;
};

function mapRow(row: ListingRow): OwnerListing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    city: row.city,
    priceMonthly: Number(row.price_monthly),
    currency: row.currency,
    status: row.status,
    coverImageUrl: row.cover_image_url,
    roomType: row.room_type,
    description: row.description,
    hostProfileId: row.host_profile_id,
    agencyClientName: row.agency_client_name,
    categoryId: row.category_id,
    availableFrom: row.available_from,
    visibility: (row.visibility === "private" ? "private" : "public") as OwnerListing["visibility"],
    listingConditions: row.listing_conditions ?? null,
    propertyVerificationStatus: (row.property_verification_status ?? "none") as OwnerListing["propertyVerificationStatus"],
  };
}

export async function fetchHostListings(hostId: string): Promise<OwnerListing[]> {
  const { data: direct, error: e1 } = await getSupabase()
    .from("habitus_listings")
    .select(
      `id, slug, name, location, city, price_monthly, currency, status, cover_image_url,
       room_type, description, host_profile_id, agency_client_name, category_id, available_from`,
    )
    .eq("host_profile_id", hostId);

  if (e1) throw e1;

  const { data: assignments, error: e2 } = await getSupabase()
    .from("habitus_listing_assignments")
    .select(
      `listing_id, habitus_listings (
        id, slug, name, location, city, price_monthly, currency, status, cover_image_url,
        room_type, description, host_profile_id, agency_client_name, category_id, available_from
      )`,
    )
    .eq("host_profile_id", hostId);

  if (e2) throw e2;

  const byId = new Map<string, OwnerListing>();
  for (const row of direct ?? []) {
    byId.set(row.id, mapRow(row as ListingRow));
  }
  for (const a of assignments ?? []) {
    const l = a.habitus_listings as unknown as ListingRow | null;
    if (l) byId.set(l.id, mapRow(l));
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function fetchApplicationsToReview(
  managerId: string,
): Promise<ReviewApplication[]> {
  const { data: owned, error: listErr } = await getSupabase()
    .from("habitus_listings")
    .select("id, slug, name, visibility")
    .or(`owner_profile_id.eq.${managerId},host_profile_id.eq.${managerId}`);

  if (listErr) throw listErr;

  const { data: assigned } = await getSupabase()
    .from("habitus_listing_assignments")
    .select("listing_id, habitus_listings (id, slug, name, visibility)")
    .eq("host_profile_id", managerId);

  const listingMap = new Map<
    string,
    { slug: string; name: string; visibility: "public" | "private" }
  >();
  for (const l of owned ?? []) {
    listingMap.set(l.id, {
      slug: l.slug,
      name: l.name,
      visibility: l.visibility === "private" ? "private" : "public",
    });
  }
  for (const a of assigned ?? []) {
    const l = a.habitus_listings as unknown as {
      id: string;
      slug: string;
      name: string;
      visibility?: string | null;
    };
    if (l) {
      listingMap.set(l.id, {
        slug: l.slug,
        name: l.name,
        visibility: l.visibility === "private" ? "private" : "public",
      });
    }
  }

  const listingIds = [...listingMap.keys()];
  if (listingIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("habitus_applications")
    .select(
      `id, status, progress_percent, applied_at, listing_id, profile_id, group_id,
       habitus_profiles (display_name, slug),
       habitus_groups (name)`,
    )
    .in("listing_id", listingIds)
    .order("applied_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const listing = listingMap.get(row.listing_id)!;
    const profile = row.habitus_profiles as unknown as { display_name: string; slug: string | null };
    const group = row.habitus_groups as unknown as { name: string } | null;
    return {
      id: row.id,
      status: row.status as string,
      progressPercent: row.progress_percent ?? 0,
      appliedAt: row.applied_at,
      applicantName: profile?.display_name ?? "Solicitante",
      applicantId: row.profile_id,
      applicantSlug: profile?.slug ?? row.profile_id,
      listingName: listing.name,
      listingId: row.listing_id,
      listingSlug: listing.slug,
      listingVisibility: listing.visibility,
      groupId: (row.group_id as string) ?? null,
      groupName: group?.name ?? null,
    };
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  progressPercent: number,
): Promise<{ error: string | null }> {
  const { data: app } = await getSupabase()
    .from("habitus_applications")
    .select("profile_id, habitus_listings (name)")
    .eq("id", applicationId)
    .maybeSingle();

  const { error } = await getSupabase()
    .from("habitus_applications")
    .update({
      status,
      progress_percent: progressPercent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  if (app?.profile_id) {
    const listing = app.habitus_listings as unknown as { name: string } | null;
    void notifyApplicationStatusChanged({
      applicationId,
      applicantId: app.profile_id as string,
      listingName: listing?.name ?? "tu solicitud",
      status,
      statusLabel: applicationStatusLabel(status),
    });
  }

  return { error: null };
}

export async function fetchPanelStats(
  profileId: string,
  role: string,
): Promise<{ listings: number; applications: number; published: number }> {
  if (role === "anfitrion") {
    const listings = await fetchMyListings(profileId, "anfitrion");
    const apps = await fetchApplicationsToReview(profileId);
    return {
      listings: listings.length,
      applications: apps.filter((a) => a.status === "submitted" || a.status === "final_review")
        .length,
      published: listings.filter((l) => l.status === "published").length,
    };
  }

  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select("id, status")
    .eq("owner_profile_id", profileId);

  if (error) throw error;
  const apps = await fetchApplicationsToReview(profileId);
  const rows = data ?? [];
  return {
    listings: rows.length,
    applications: apps.filter((a) => a.status === "submitted" || a.status === "final_review")
      .length,
    published: rows.filter((l) => l.status === "published").length,
  };
}
