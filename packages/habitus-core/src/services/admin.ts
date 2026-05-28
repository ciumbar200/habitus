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

export type AdminMarketplaceDashboard = {
  roles: {
    tenants: {
      registered: number;
      incompleteProfiles: number;
      activeUsers: number;
      usersWithoutMatch: number;
      citiesTracked: number;
      withBudget: number;
      withMoveIn: number;
    };
    owners: {
      total: number;
      listingsPublished: number;
      listingsPending: number;
      groupsInterested: number;
      groupsAccepted: number;
      lowConversionListings: number;
    };
    hosts: {
      total: number;
      roomsPublished: number;
      candidatesReceived: number;
      pendingApplications: number;
      occupiedRooms: number;
      incompleteListings: number;
    };
    operators: {
      total: number;
      inventoryPublished: number;
      activeUnits: number;
      applicationsReceived: number;
      conversionRate: number | null;
      responsePending: number;
      potentialCommissions: number;
    };
  };
  assistedMatching: { from: string; to: string; count: number; criteria: string }[];
  funnel: {
    applicationsCreated: number;
    matchesSent: number;
    matchesAccepted: number;
    reservationsPending: number;
    confirmedEntries: number;
    matchesLost: number;
    potentialContractValue: number;
    estimatedCommission: number;
    confirmedCommission: number;
    pendingCommission: number;
    currency: string;
  };
};

export type AdminListingRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  location: string | null;
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

export type AdminUserExtended = {
  id: string;
  email: string;
  displayName: string;
  accountRole: AccountRoleSlug | null;
  adminRole: "support" | "super" | null;
  isAdmin: boolean;
  isDiscoverable: boolean;
  identityStatus: IdentityStatus;
  profileScore: number;
  suspendedAt: string | null;
  deletedAt: string | null;
  city: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
};

export type AdminIntroduction = {
  id: string;
  adminId: string;
  profileId: string;
  profileName?: string;
  listingId: string | null;
  listingName?: string;
  groupId: string | null;
  compatibilityScore: number | null;
  internalNotes: string | null;
  status: "proposed" | "notified" | "accepted" | "rejected" | "expired";
  applicationId: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

type ListingDbRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  location: string | null;
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

export async function fetchAdminMarketplaceDashboard(): Promise<AdminMarketplaceDashboard> {
  const [profilesRes, listingsRes, appsRes, groupsRes] = await Promise.all([
    getSupabase()
      .from("habitus_profiles")
      .select("id, account_role, profile_score, is_discoverable, search_prefs, updated_at"),
    getSupabase()
      .from("habitus_listings")
      .select(
        "id, status, city, price_monthly, currency, owner_profile_id, host_profile_id, created_at",
      ),
    getSupabase()
      .from("habitus_applications")
      .select(
        `id, status, listing_id, profile_id, applied_at,
         habitus_listings (owner_profile_id, host_profile_id, price_monthly, currency, city)`,
      ),
    getSupabase().from("habitus_groups").select("id, status, city, listing_id"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (listingsRes.error) throw listingsRes.error;
  if (appsRes.error) throw appsRes.error;
  if (groupsRes.error) throw groupsRes.error;

  const profiles = (profilesRes.data ?? []) as {
    id: string;
    account_role: AccountRoleSlug | null;
    profile_score: number | null;
    is_discoverable: boolean | null;
    search_prefs: unknown;
    updated_at: string | null;
  }[];
  const roleByProfile = new Map(profiles.map((p) => [p.id, p.account_role]));
  const listings = (listingsRes.data ?? []) as unknown as {
    id: string;
    status: string;
    city: string | null;
    price_monthly: number | null;
    currency: string | null;
    owner_profile_id: string | null;
    host_profile_id: string | null;
    created_at: string | null;
  }[];
  const applications = (appsRes.data ?? []) as unknown as {
    id: string;
    status: string;
    listing_id: string;
    profile_id: string | null;
    applied_at: string | null;
    habitus_listings:
      | {
          owner_profile_id: string | null;
          host_profile_id: string | null;
          price_monthly: number | null;
          currency: string | null;
          city: string | null;
        }
      | null;
  }[];
  const groups = (groupsRes.data ?? []) as {
    id: string;
    status: string | null;
    city: string | null;
    listing_id: string | null;
  }[];

  const tenants = profiles.filter((p) => p.account_role === "inquilino");
  const owners = profiles.filter((p) => p.account_role === "propietario");
  const hosts = profiles.filter((p) => p.account_role === "anfitrion");
  const operators = profiles.filter((p) => p.account_role === "agencia");
  const tenantApprovedIds = new Set(
    applications.filter((a) => a.status === "approved" && a.profile_id).map((a) => a.profile_id),
  );
  const tenantCities = new Set<string>();
  let tenantsWithBudget = 0;
  let tenantsWithMoveIn = 0;
  for (const tenant of tenants) {
    const prefs = tenant.search_prefs as Record<string, unknown> | null;
    if (typeof prefs?.city === "string" && prefs.city) tenantCities.add(prefs.city);
    if (typeof prefs?.budgetMax === "number" && prefs.budgetMax > 0) tenantsWithBudget += 1;
    if (typeof prefs?.moveIn === "string" && prefs.moveIn) tenantsWithMoveIn += 1;
  }

  const ownerListings = listings.filter((l) => roleByProfile.get(l.owner_profile_id ?? "") === "propietario");
  const operatorListings = listings.filter((l) => roleByProfile.get(l.owner_profile_id ?? "") === "agencia");
  const hostListings = listings.filter((l) => roleByProfile.get(l.owner_profile_id ?? "") === "anfitrion");
  const appsByListing = new Map<string, typeof applications>();
  for (const app of applications) {
    const current = appsByListing.get(app.listing_id) ?? [];
    current.push(app);
    appsByListing.set(app.listing_id, current);
  }

  const pendingStatuses = ["submitted", "interview_scheduled", "final_review"];
  const operatorApps = applications.filter(
    (a) => roleByProfile.get(a.habitus_listings?.owner_profile_id ?? "") === "agencia",
  );
  const hostApps = applications.filter(
    (a) => roleByProfile.get(a.habitus_listings?.owner_profile_id ?? "") === "anfitrion",
  );
  const annualContractValue = applications
    .filter((a) => a.status !== "rejected")
    .reduce((sum, a) => sum + Number(a.habitus_listings?.price_monthly ?? 0) * 12, 0);
  const pendingCommission = applications
    .filter((a) => pendingStatuses.includes(a.status))
    .reduce((sum, a) => sum + Number(a.habitus_listings?.price_monthly ?? 0), 0);
  const confirmedCommission = applications
    .filter((a) => a.status === "approved")
    .reduce((sum, a) => sum + Number(a.habitus_listings?.price_monthly ?? 0), 0);

  return {
    roles: {
      tenants: {
        registered: tenants.length,
        incompleteProfiles: tenants.filter((p) => (p.profile_score ?? 0) < 60).length,
        activeUsers: tenants.filter((p) => p.is_discoverable).length,
        usersWithoutMatch: tenants.length - tenantApprovedIds.size,
        citiesTracked: tenantCities.size,
        withBudget: tenantsWithBudget,
        withMoveIn: tenantsWithMoveIn,
      },
      owners: {
        total: owners.length,
        listingsPublished: ownerListings.filter((l) => l.status === "published").length,
        listingsPending: ownerListings.filter((l) => l.status === "draft").length,
        groupsInterested: groups.filter((g) => g.listing_id).length,
        groupsAccepted: groups.filter((g) => g.status === "active").length,
        lowConversionListings: ownerListings.filter((l) => (appsByListing.get(l.id) ?? []).length === 0)
          .length,
      },
      hosts: {
        total: hosts.length,
        roomsPublished: hostListings.filter((l) => l.status === "published").length,
        candidatesReceived: hostApps.length,
        pendingApplications: hostApps.filter((a) => pendingStatuses.includes(a.status)).length,
        occupiedRooms: hostApps.filter((a) => a.status === "approved").length,
        incompleteListings: hostListings.filter((l) => l.status === "draft").length,
      },
      operators: {
        total: operators.length,
        inventoryPublished: operatorListings.length,
        activeUnits: operatorListings.filter((l) => l.status === "published").length,
        applicationsReceived: operatorApps.length,
        conversionRate: operatorApps.length
          ? Math.round((operatorApps.filter((a) => a.status === "approved").length / operatorApps.length) * 100)
          : null,
        responsePending: operatorApps.filter((a) => pendingStatuses.includes(a.status)).length,
        potentialCommissions: operatorApps.reduce(
          (sum, a) => sum + Number(a.habitus_listings?.price_monthly ?? 0),
          0,
        ),
      },
    },
    assistedMatching: [
      { from: "Inquilino", to: "habitaciones compatibles", count: hostListings.length, criteria: "ciudad, presupuesto, fecha y convivencia" },
      { from: "Inquilino", to: "colivings compatibles", count: operatorListings.length, criteria: "ciudad, presupuesto, fecha y duración" },
      { from: "Inquilino", to: "grupos compatibles", count: groups.length, criteria: "ciudad, zona y objetivo de búsqueda" },
      { from: "Grupo", to: "pisos compatibles", count: ownerListings.length, criteria: "ciudad, presupuesto y tamaño del grupo" },
      { from: "Habitación", to: "candidatos compatibles", count: tenants.length, criteria: "perfil de convivencia y presupuesto" },
      { from: "Operador", to: "candidatos por unidad", count: operatorApps.length, criteria: "unidad, estado de solicitud y match" },
    ],
    funnel: {
      applicationsCreated: applications.length,
      matchesSent: applications.filter((a) => a.status !== "draft").length,
      matchesAccepted: applications.filter((a) => a.status === "approved").length,
      reservationsPending: applications.filter((a) => a.status === "final_review").length,
      confirmedEntries: applications.filter((a) => a.status === "approved").length,
      matchesLost: applications.filter((a) => a.status === "rejected").length,
      potentialContractValue: annualContractValue,
      estimatedCommission: pendingCommission + confirmedCommission,
      confirmedCommission,
      pendingCommission,
      currency: applications[0]?.habitus_listings?.currency ?? listings[0]?.currency ?? "EUR",
    },
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

export async function adminSetAccountRole(
  userId: string,
  role: string | null,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({ account_role: role })
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
      `id, slug, name, city, location, status, price_monthly, owner_profile_id, host_profile_id,
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
      location: row.location ?? null,
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

// ─── Admin groups ────────────────────────────────────────────────────────────

export type AdminGroupRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  memberCount: number;
  creatorName: string;
  createdAt: string;
};

export async function fetchAdminGroups(): Promise<AdminGroupRow[]> {
  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .select("id, slug, name, city, status, created_at, habitus_profiles!creator_id(display_name), habitus_group_members(id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const creator = row.habitus_profiles as { display_name?: string } | null;
    const members = row.habitus_group_members as { id: string }[] | null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      status: row.status,
      memberCount: members?.length ?? 0,
      creatorName: creator?.display_name ?? "—",
      createdAt: row.created_at,
    };
  });
}

export async function adminSetGroupStatus(
  groupId: string,
  status: string,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_groups")
    .update({ status })
    .eq("id", groupId);
  return error?.message ?? null;
}

// ─── Admin applications pipeline ─────────────────────────────────────────────

export type AdminApplicationRow = {
  id: string;
  profileId: string;
  profileName: string;
  listingId: string;
  listingName: string;
  listingCity: string | null;
  groupId: string | null;
  status: string;
  progress: number;
  appliedAt: string;
  source: string | null;
};

export async function fetchAdminApplications(): Promise<AdminApplicationRow[]> {
  const { data, error } = await getSupabase()
    .from("habitus_applications")
    .select(
      "id, profile_id, listing_id, group_id, status, progress_percent, applied_at, source, habitus_profiles!profile_id(display_name), habitus_listings!listing_id(name, city)",
    )
    .order("applied_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = row.habitus_profiles as { display_name?: string } | null;
    const listing = row.habitus_listings as { name?: string; city?: string | null } | null;
    return {
      id: row.id,
      profileId: row.profile_id,
      profileName: profile?.display_name ?? "—",
      listingId: row.listing_id,
      listingName: listing?.name ?? "—",
      listingCity: listing?.city ?? null,
      groupId: row.group_id ?? null,
      status: row.status,
      progress: row.progress_percent ?? 0,
      appliedAt: row.applied_at,
      source: (row as Record<string, unknown>).source as string | null ?? null,
    };
  });
}

export async function adminSetApplicationStatus(
  applicationId: string,
  status: string,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);
  return error?.message ?? null;
}

// ─── Extended user management ────────────────────────────────────────────────

export async function fetchAdminUsersExtended(): Promise<AdminUserExtended[]> {
  const { data, error } = await getSupabase().rpc("habitus_admin_get_users_with_email");
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    email: (r.email as string) ?? "",
    displayName: (r.display_name as string) ?? "",
    accountRole: (r.account_role as AccountRoleSlug | null) ?? null,
    adminRole: (r.admin_role as "support" | "super" | null) ?? null,
    isAdmin: Boolean(r.is_admin),
    isDiscoverable: Boolean(r.is_discoverable),
    identityStatus: ((r.identity_status as string) ?? "none") as IdentityStatus,
    profileScore: Number(r.profile_score ?? 0),
    suspendedAt: (r.suspended_at as string | null) ?? null,
    deletedAt: (r.deleted_at as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    onboardingCompletedAt: (r.onboarding_completed_at as string | null) ?? null,
    createdAt: (r.created_at as string) ?? "",
  }));
}

export async function adminSuspendUser(
  userId: string,
  suspend: boolean,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({ suspended_at: suspend ? new Date().toISOString() : null })
    .eq("id", userId);
  return error?.message ?? null;
}

export async function adminInviteAmbassador(
  email: string,
  name: string | undefined,
  accessToken: string,
  apiBase = "",
): Promise<{ referralCode: string | null; error: string | null }> {
  const res = await fetch(`${apiBase}/api/admin/invite-ambassador`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, name }),
  });
  const json = (await res.json()) as { ok?: boolean; referralCode?: string | null; error?: string };
  if (!res.ok || !json.ok) return { referralCode: null, error: json.error ?? "Error al invitar." };
  return { referralCode: json.referralCode ?? null, error: null };
}

// ─── Ambassadors ─────────────────────────────────────────────────────────────

export type AdminAmbassador = {
  id: string;
  displayName: string;
  email: string;
  referralCode: string | null;
  qualifiedCount: number;
  createdAt: string;
};

export async function fetchAdminAmbassadors(): Promise<AdminAmbassador[]> {
  const { data, error } = await getSupabase().rpc("habitus_admin_get_users_with_email");
  if (error) throw error;
  const ambassadors = ((data ?? []) as Record<string, unknown>[]).filter(
    (r) => r.account_role === "embajador",
  );
  if (ambassadors.length === 0) return [];

  const ids = ambassadors.map((r) => r.id as string);
  const { data: profiles } = await getSupabase()
    .from("habitus_profiles")
    .select("id, referral_code")
    .in("id", ids);

  const { data: referralCounts } = await getSupabase()
    .from("habitus_referrals")
    .select("referrer_id")
    .in("referrer_id", ids)
    .eq("status", "qualified");

  const codeMap = new Map((profiles ?? []).map((p) => [p.id, p.referral_code as string | null]));
  const countMap = new Map<string, number>();
  for (const row of referralCounts ?? []) {
    countMap.set(row.referrer_id, (countMap.get(row.referrer_id) ?? 0) + 1);
  }

  return ambassadors.map((r) => ({
    id: r.id as string,
    displayName: (r.display_name as string) ?? "",
    email: (r.email as string) ?? "",
    referralCode: codeMap.get(r.id as string) ?? null,
    qualifiedCount: countMap.get(r.id as string) ?? 0,
    createdAt: (r.created_at as string) ?? "",
  }));
}

// ─── Admin introductions (curated matching) ───────────────────────────────────

export async function fetchAdminIntroductions(): Promise<AdminIntroduction[]> {
  const { data, error } = await getSupabase()
    .from("admin_introductions")
    .select(
      "id, admin_id, profile_id, listing_id, group_id, compatibility_score, internal_notes, status, application_id, notified_at, created_at, habitus_profiles!profile_id(display_name), habitus_listings!listing_id(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const profile = r.habitus_profiles as { display_name?: string } | null;
    const listing = r.habitus_listings as { name?: string } | null;
    return {
      id: r.id,
      adminId: r.admin_id,
      profileId: r.profile_id,
      profileName: profile?.display_name,
      listingId: r.listing_id,
      listingName: listing?.name,
      groupId: r.group_id,
      compatibilityScore: r.compatibility_score,
      internalNotes: r.internal_notes,
      status: r.status as AdminIntroduction["status"],
      applicationId: r.application_id,
      notifiedAt: r.notified_at,
      createdAt: r.created_at,
    };
  });
}

export async function createAdminIntroduction(input: {
  adminId: string;
  profileId: string;
  listingId?: string;
  groupId?: string;
  compatibilityScore?: number;
  internalNotes?: string;
  notify: boolean;
}): Promise<{ id: string; error: string | null }> {
  const { data, error } = await getSupabase()
    .from("admin_introductions")
    .insert({
      admin_id: input.adminId,
      profile_id: input.profileId,
      listing_id: input.listingId ?? null,
      group_id: input.groupId ?? null,
      compatibility_score: input.compatibilityScore ?? null,
      internal_notes: input.internalNotes ?? null,
      status: input.notify ? "notified" : "proposed",
      notified_at: input.notify ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) return { id: "", error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

export async function updateIntroductionStatus(
  id: string,
  status: AdminIntroduction["status"],
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("admin_introductions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return error?.message ?? null;
}
