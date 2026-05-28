import { getSupabase } from "../client";
import { normalizeSearchPrefs, searchPrefsDiscoverLocation } from "../types/searchPrefs";
import { fetchApplicationsToReview } from "./hostPanel";
import { fetchHostListings } from "./hostPanel";
import type { AccountRoleSlug } from "../types/models";

export type InquilinoMetrics = {
  applicationsTotal: number;
  applicationsPending: number;
  applicationsApproved: number;
  bookmarksListings: number;
  bookmarksShowcase: number;
  conversations: number;
  profileScore: number;
};

export type ManagerMetrics = {
  listings: number;
  published: number;
  drafts: number;
  archived: number;
  applicationsPending: number;
  applicationsApproved: number;
  applicationsRejected: number;
  applicationsTotal: number;
  monthlyRevenueEstimate: number;
  currency: string;
  hostsAssigned: number;
  clientsCount: number;
};

export type OperatorCandidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  budget: string;
  moveIn: string;
  duration: string;
  cityZone: string;
  status: string;
  matchScore: number | null;
  listingName: string;
  listingSlug: string;
  profileSlug: string;
};

export type OperatorUnitMetric = {
  id: string;
  name: string;
  slug: string;
  status: string;
  availableFrom: string | null;
  priceMonthly: number;
  currency: string;
  applications: number;
  activeCandidates: number;
  conversionRate: number | null;
  daysPublished: number | null;
};

export type OperatorDashboardData = {
  metrics: {
    listings: number;
    available: number;
    newApplications: number;
    pendingMatches: number;
    acceptedCandidates: number;
    confirmedEntries: number;
    averageDaysToMatch: number | null;
    estimatedOccupancy: number | null;
    potentialRevenue: number;
    currency: string;
  };
  pipeline: Record<string, number>;
  candidates: OperatorCandidate[];
  units: OperatorUnitMetric[];
  notifications: { label: string; count: number }[];
};

export async function fetchInquilinoMetrics(userId: string): Promise<InquilinoMetrics> {
  const [appsRes, listBm, showBm, convRes, profileRes] = await Promise.all([
    getSupabase().from("habitus_applications").select("status").eq("profile_id", userId),
    getSupabase()
      .from("habitus_listing_bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId),
    getSupabase()
      .from("habitus_showcase_bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId),
    getSupabase()
      .from("habitus_conversation_participants")
      .select("conversation_id", { count: "exact", head: true })
      .eq("profile_id", userId),
    getSupabase().from("habitus_profiles").select("profile_score").eq("id", userId).maybeSingle(),
  ]);

  const apps = appsRes.data ?? [];
  const pending = apps.filter((a) =>
    ["submitted", "interview_scheduled", "final_review"].includes(a.status as string),
  ).length;
  const approved = apps.filter((a) => a.status === "approved").length;

  return {
    applicationsTotal: apps.length,
    applicationsPending: pending,
    applicationsApproved: approved,
    bookmarksListings: listBm.count ?? 0,
    bookmarksShowcase: showBm.count ?? 0,
    conversations: convRes.error ? 0 : (convRes.count ?? 0),
    profileScore: profileRes.data?.profile_score ?? 0,
  };
}

export async function fetchManagerMetrics(
  profileId: string,
  role: AccountRoleSlug,
): Promise<ManagerMetrics> {
  let listings: {
    status: string;
    price_monthly: number;
    currency: string;
    host_profile_id: string | null;
    agency_client_name: string | null;
  }[] = [];

  if (role === "anfitrion") {
    const hostListings = await fetchHostListings(profileId);
    listings = hostListings.map((l) => ({
      status: l.status,
      price_monthly: l.priceMonthly,
      currency: l.currency,
      host_profile_id: l.hostProfileId,
      agency_client_name: l.agencyClientName,
    }));
  } else {
    const { data, error } = await getSupabase()
      .from("habitus_listings")
      .select("status, price_monthly, currency, host_profile_id, agency_client_name")
      .eq("owner_profile_id", profileId);
    if (error) throw error;
    listings = data ?? [];
  }

  const apps = await fetchApplicationsToReview(profileId);
  const published = listings.filter((l) => l.status === "published");
  const revenue = published.reduce((sum, l) => sum + Number(l.price_monthly), 0);
  const clients = new Set(
    listings.map((l) => l.agency_client_name).filter(Boolean),
  ).size;
  const hosts = new Set(listings.map((l) => l.host_profile_id).filter(Boolean)).size;

  return {
    listings: listings.length,
    published: published.length,
    drafts: listings.filter((l) => l.status === "draft").length,
    archived: listings.filter((l) => l.status === "archived").length,
    applicationsPending: apps.filter((a) =>
      ["submitted", "interview_scheduled", "final_review"].includes(a.status),
    ).length,
    applicationsApproved: apps.filter((a) => a.status === "approved").length,
    applicationsRejected: apps.filter((a) => a.status === "rejected").length,
    applicationsTotal: apps.length,
    monthlyRevenueEstimate: revenue,
    currency: published[0]?.currency ?? listings[0]?.currency ?? "EUR",
    hostsAssigned: hosts,
    clientsCount: clients,
  };
}

export async function fetchOperatorDashboard(profileId: string): Promise<OperatorDashboardData> {
  const { data: listingsData, error: listingsError } = await getSupabase()
    .from("habitus_listings")
    .select("id, slug, name, status, city, location, price_monthly, currency, available_from, created_at")
    .eq("owner_profile_id", profileId);

  if (listingsError) throw listingsError;

  const listings = (listingsData ?? []) as {
    id: string;
    slug: string;
    name: string;
    status: string;
    city: string | null;
    location: string | null;
    price_monthly: number;
    currency: string;
    available_from: string | null;
    created_at: string | null;
  }[];

  const listingIds = listings.map((l) => l.id);
  let applications: {
    id: string;
    status: string;
    progress_percent: number | null;
    applied_at: string | null;
    listing_id: string;
    profile_id: string;
    habitus_profiles:
      | {
          display_name: string | null;
          slug: string | null;
          avatar_url: string | null;
          profile_score: number | null;
          search_prefs: unknown;
        }
      | null;
  }[] = [];

  if (listingIds.length > 0) {
    const { data, error } = await getSupabase()
      .from("habitus_applications")
      .select(
        `id, status, progress_percent, applied_at, listing_id, profile_id,
         habitus_profiles (display_name, slug, avatar_url, profile_score, search_prefs)`,
      )
      .in("listing_id", listingIds)
      .order("applied_at", { ascending: false });

    if (error) throw error;
    applications = (data ?? []) as unknown as typeof applications;
  }

  const listingById = new Map(listings.map((l) => [l.id, l]));
  const applicationsByListing = new Map<string, typeof applications>();
  for (const app of applications) {
    const current = applicationsByListing.get(app.listing_id) ?? [];
    current.push(app);
    applicationsByListing.set(app.listing_id, current);
  }

  const activeStatuses = ["submitted", "interview_scheduled", "final_review"];
  const newApplications = applications.filter((a) => a.status === "submitted").length;
  const pendingMatches = applications.filter((a) =>
    ["submitted", "interview_scheduled", "final_review"].includes(a.status),
  ).length;
  const acceptedCandidates = applications.filter((a) => a.status === "approved").length;
  const confirmedEntries = acceptedCandidates;
  const published = listings.filter((l) => l.status === "published");
  const potentialRevenue = published.reduce((sum, l) => sum + Number(l.price_monthly ?? 0), 0);

  const pipeline = {
    "Nuevo lead": newApplications,
    "Perfil completo": applications.filter((a) => (a.habitus_profiles?.profile_score ?? 0) >= 70)
      .length,
    "Match recomendado": applications.filter((a) => (a.progress_percent ?? 0) >= 70).length,
    Contactado: applications.filter((a) => a.status === "interview_scheduled").length,
    Aceptado: acceptedCandidates,
    "Reserva pendiente": applications.filter((a) => a.status === "final_review").length,
    Confirmado: confirmedEntries,
    Entró: 0,
    Perdido: applications.filter((a) => a.status === "rejected").length,
  };

  const candidates = applications.slice(0, 12).map((app) => {
    const listing = listingById.get(app.listing_id);
    const prefs = normalizeSearchPrefs(app.habitus_profiles?.search_prefs);
    return {
      id: app.id,
      name: app.habitus_profiles?.display_name ?? "Candidato",
      avatarUrl: app.habitus_profiles?.avatar_url ?? null,
      budget: prefs.budgetMax ? `${prefs.budgetMax} €/mes` : "Pendiente",
      moveIn: prefs.moveIn ?? "Pendiente",
      duration: "Pendiente",
      cityZone: searchPrefsDiscoverLocation(prefs) || listing?.city || "Pendiente",
      status: app.status,
      matchScore: app.progress_percent ?? null,
      listingName: listing?.name ?? "Unidad",
      listingSlug: listing?.slug ?? app.listing_id,
      profileSlug: app.habitus_profiles?.slug ?? app.profile_id,
    };
  });

  const units = listings.map((listing) => {
    const apps = applicationsByListing.get(listing.id) ?? [];
    const activeCandidates = apps.filter((a) => activeStatuses.includes(a.status)).length;
    const approved = apps.filter((a) => a.status === "approved").length;
    const createdAt = listing.created_at ? new Date(listing.created_at).getTime() : null;
    return {
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      status: listing.status,
      availableFrom: listing.available_from,
      priceMonthly: Number(listing.price_monthly ?? 0),
      currency: listing.currency ?? "EUR",
      applications: apps.length,
      activeCandidates,
      conversionRate: apps.length ? Math.round((approved / apps.length) * 100) : null,
      daysPublished: createdAt ? Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000)) : null,
    };
  });

  return {
    metrics: {
      listings: listings.length,
      available: published.length,
      newApplications,
      pendingMatches,
      acceptedCandidates,
      confirmedEntries,
      averageDaysToMatch: null,
      estimatedOccupancy: listings.length
        ? Math.round(((listings.length - published.length) / listings.length) * 100)
        : null,
      potentialRevenue,
      currency: published[0]?.currency ?? listings[0]?.currency ?? "EUR",
    },
    pipeline,
    candidates,
    units,
    notifications: [
      { label: "Nueva solicitud", count: newApplications },
      { label: "Candidato aceptado", count: acceptedCandidates },
      { label: "Match pendiente", count: pendingMatches },
      { label: "Habitación sin actividad", count: units.filter((u) => u.applications === 0).length },
      { label: "Publicación incompleta", count: listings.filter((l) => l.status === "draft").length },
      { label: "Operador debe responder", count: pendingMatches },
      { label: "Reserva pendiente", count: pipeline["Reserva pendiente"] },
    ],
  };
}
