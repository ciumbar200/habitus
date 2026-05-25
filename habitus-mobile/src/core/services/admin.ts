import { getSupabase } from "../client";
import type {
  AdminReport,
  AdminUserRow,
  AccountRoleSlug,
  IdentityStatus,
  PropertyVerificationStatus,
} from "../types/models";

export type AdminStats = {
  users: number;
  listingsPublished: number;
  listingsDraft: number;
  openReports: number;
  blogPosts: number;
  upcomingEvents: number;
};

export type AdminListingRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  priceMonthly: number;
  ownerProfileId: string | null;
  ownerName: string | null;
  hostProfileId: string | null;
  hostName: string | null;
  categorySlug: string | null;
  propertyVerificationStatus: PropertyVerificationStatus;
  canAssignHost: boolean;
};

type ListingDbRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  price_monthly: number;
  owner_profile_id: string | null;
  host_profile_id: string | null;
  property_verification_status: string | null;
  habitus_categories: { slug: string } | null;
  habitus_listing_assignments: { host_profile_id: string }[] | null;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const [profiles, listings, reports, blog, events] = await Promise.all([
    getSupabase().from("habitus_profiles").select("id", { count: "exact", head: true }),
    getSupabase().from("habitus_listings").select("status", { count: "exact" }),
    getSupabase()
      .from("habitus_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    getSupabase()
      .from("habitus_blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    getSupabase()
      .from("habitus_community_events")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("starts_at", new Date().toISOString()),
  ]);

  const listingRows = listings.data ?? [];
  const published = listingRows.filter((r: { status: string }) => r.status === "published").length;
  const draft = listingRows.filter((r: { status: string }) => r.status === "draft").length;

  return {
    users: profiles.count ?? 0,
    listingsPublished: published,
    listingsDraft: draft,
    openReports: reports.count ?? 0,
    blogPosts: blog.count ?? 0,
    upcomingEvents: events.count ?? 0,
  };
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, display_name, account_role, profile_score, is_admin, is_discoverable, created_at, identity_status",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return ((data ?? []) as {
    id: string;
    display_name: string;
    account_role: string | null;
    profile_score: number;
    is_admin: boolean;
    is_discoverable: boolean;
    created_at: string;
    identity_status: string | null;
  }[]).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    email: null,
    accountRole: (r.account_role as AccountRoleSlug) ?? null,
    profileScore: r.profile_score,
    isAdmin: r.is_admin,
    isDiscoverable: r.is_discoverable,
    identityStatus: (r.identity_status ?? "none") as IdentityStatus,
    createdAt: r.created_at,
  }));
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId);
  return error?.message ?? null;
}

export async function setUserDiscoverable(
  userId: string,
  isDiscoverable: boolean,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({ is_discoverable: isDiscoverable })
    .eq("id", userId);
  return error?.message ?? null;
}

export async function adminSetIdentityStatus(
  userId: string,
  status: IdentityStatus,
): Promise<string | null> {
  const payload: Record<string, unknown> = {
    identity_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === "verified") {
    payload.identity_verified_at = new Date().toISOString();
  } else if (status === "none") {
    payload.identity_verified_at = null;
  }

  const { error } = await getSupabase().from("habitus_profiles").update(payload).eq("id", userId);
  return error?.message ?? null;
}

export async function fetchAdminHosts(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select("id, display_name")
    .eq("account_role", "anfitrion")
    .order("display_name");

  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
}

export async function fetchAdminListings(): Promise<AdminListingRow[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listings")
    .select(
      `id, slug, name, city, status, price_monthly, owner_profile_id, host_profile_id,
       property_verification_status,
       habitus_categories (slug),
       habitus_listing_assignments (host_profile_id)`,
    )
    .order("updated_at", { ascending: false })
    .limit(150);

  if (error) throw error;

  const rows = (data ?? []) as unknown as ListingDbRow[];
  const profileIds = new Set<string>();
  for (const row of rows) {
    if (row.owner_profile_id) profileIds.add(row.owner_profile_id);
    if (row.host_profile_id) profileIds.add(row.host_profile_id);
    for (const a of row.habitus_listing_assignments ?? []) {
      if (a.host_profile_id) profileIds.add(a.host_profile_id);
    }
  }

  const nameMap = new Map<string, string>();
  if (profileIds.size > 0) {
    const { data: profiles } = await getSupabase()
      .from("habitus_profiles")
      .select("id, display_name")
      .in("id", [...profileIds]);
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.display_name);
    }
  }

  return rows.map((row) => {
    const categorySlug = row.habitus_categories?.slug ?? null;
    const assignedHostId =
      row.habitus_listing_assignments?.[0]?.host_profile_id ??
      (row.host_profile_id && row.host_profile_id !== row.owner_profile_id
        ? row.host_profile_id
        : null);
    const effectiveHostId = assignedHostId ?? row.host_profile_id;
    const isAnfitrionOwned =
      row.owner_profile_id != null &&
      row.host_profile_id != null &&
      row.owner_profile_id === row.host_profile_id;
    const canAssignHost = categorySlug === "piso-grupo" && !isAnfitrionOwned;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      status: row.status,
      priceMonthly: Number(row.price_monthly),
      ownerProfileId: row.owner_profile_id,
      ownerName: row.owner_profile_id ? nameMap.get(row.owner_profile_id) ?? null : null,
      hostProfileId: effectiveHostId,
      hostName: effectiveHostId ? nameMap.get(effectiveHostId) ?? null : null,
      categorySlug,
      propertyVerificationStatus: (row.property_verification_status ??
        "none") as PropertyVerificationStatus,
      canAssignHost: canAssignHost && !isAnfitrionOwned,
    };
  });
}

export async function adminAssignListingHost(
  listingId: string,
  hostProfileId: string | null,
  assignedBy: string,
): Promise<string | null> {
  const { data: listing, error: fetchErr } = await getSupabase()
    .from("habitus_listings")
    .select("owner_profile_id, host_profile_id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr) return fetchErr.message;
  if (!listing) return "Anuncio no encontrado.";

  const isAnfitrionOwned =
    listing.owner_profile_id &&
    listing.host_profile_id &&
    listing.owner_profile_id === listing.host_profile_id;
  if (isAnfitrionOwned) return "No se puede reasignar una habitación del anfitrión.";

  await getSupabase()
    .from("habitus_listing_assignments")
    .delete()
    .eq("listing_id", listingId);

  if (!hostProfileId) {
    const { error: clearErr } = await getSupabase()
      .from("habitus_listings")
      .update({
        host_profile_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);
    return clearErr?.message ?? null;
  }

  const { error: insErr } = await getSupabase().from("habitus_listing_assignments").insert({
    listing_id: listingId,
    host_profile_id: hostProfileId,
    assigned_by: assignedBy,
  });
  if (insErr) return insErr.message;

  const { error: updErr } = await getSupabase()
    .from("habitus_listings")
    .update({
      host_profile_id: hostProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  return updErr?.message ?? null;
}

export async function adminSetPropertyVerification(
  listingId: string,
  status: PropertyVerificationStatus,
): Promise<string | null> {
  const payload: Record<string, unknown> = {
    property_verification_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === "verified") {
    payload.property_verified_at = new Date().toISOString();
  } else if (status === "none") {
    payload.property_verified_at = null;
  }

  const { error } = await getSupabase()
    .from("habitus_listings")
    .update(payload)
    .eq("id", listingId);

  return error?.message ?? null;
}

export async function setListingStatus(
  listingId: string,
  status: "draft" | "published" | "archived",
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", listingId);
  return error?.message ?? null;
}

export async function adminBulkSetListingStatus(
  listingIds: string[],
  status: "draft" | "published" | "archived",
): Promise<string | null> {
  for (const id of listingIds) {
    const err = await setListingStatus(id, status);
    if (err) return err;
  }
  return null;
}

export async function adminBulkSetPropertyVerification(
  listingIds: string[],
  status: PropertyVerificationStatus,
): Promise<string | null> {
  for (const id of listingIds) {
    const err = await adminSetPropertyVerification(id, status);
    if (err) return err;
  }
  return null;
}

export async function adminBulkSetIdentityStatus(
  userIds: string[],
  status: IdentityStatus,
): Promise<string | null> {
  for (const id of userIds) {
    const err = await adminSetIdentityStatus(id, status);
    if (err) return err;
  }
  return null;
}

export async function adminBulkSetDiscoverable(
  userIds: string[],
  isDiscoverable: boolean,
): Promise<string | null> {
  for (const id of userIds) {
    const err = await setUserDiscoverable(id, isDiscoverable);
    if (err) return err;
  }
  return null;
}

export async function adminBulkUpdateReportStatus(
  reportIds: string[],
  status: AdminReport["status"],
): Promise<string | null> {
  for (const id of reportIds) {
    const err = await updateReportStatus(id, status);
    if (err) return err;
  }
  return null;
}

export async function fetchAdminReports(): Promise<AdminReport[]> {
  const { data, error } = await getSupabase()
    .from("habitus_reports")
    .select("id, reporter_id, target_type, target_id, reason, status, admin_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return ((data ?? []) as {
    id: string;
    reporter_id: string | null;
    target_type: string;
    target_id: string;
    reason: string;
    status: string;
    admin_notes: string | null;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    targetType: r.target_type as AdminReport["targetType"],
    targetId: r.target_id,
    reason: r.reason,
    status: r.status as AdminReport["status"],
    adminNotes: r.admin_notes,
    createdAt: r.created_at,
  }));
}

export async function updateReportStatus(
  reportId: string,
  status: AdminReport["status"],
  adminNotes?: string,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_reports")
    .update({
      status,
      admin_notes: adminNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  return error?.message ?? null;
}

export async function submitReport(input: {
  reporterId: string;
  targetType: AdminReport["targetType"];
  targetId: string;
  reason: string;
}): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
  });
  return error?.message ?? null;
}
