import { getSupabase } from "../client";
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
