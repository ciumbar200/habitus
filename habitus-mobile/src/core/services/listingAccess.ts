import { getSupabase } from "../client";
import type { ListingAccessGrant } from "../types/models";

export async function fetchListingAccess(listingId: string): Promise<ListingAccessGrant[]> {
  const { data, error } = await getSupabase()
    .from("habitus_listing_access")
    .select(
      `id, listing_id, group_id, profile_id, granted_at,
       habitus_groups (name, slug),
       habitus_profiles!habitus_listing_access_profile_id_fkey (display_name, slug)`,
    )
    .eq("listing_id", listingId)
    .order("granted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const g = row.habitus_groups as unknown as { name: string; slug: string } | null;
    const p = row.habitus_profiles as unknown as { display_name: string; slug: string | null } | null;
    return {
      id: row.id as string,
      listingId: row.listing_id as string,
      groupId: (row.group_id as string) ?? null,
      groupName: g?.name ?? null,
      groupSlug: g?.slug ?? null,
      profileId: (row.profile_id as string) ?? null,
      profileName: p?.display_name ?? null,
      profileSlug: p?.slug ?? null,
      grantedAt: row.granted_at as string,
    };
  });
}

export async function grantListingAccessToGroup(
  listingId: string,
  groupId: string,
  ownerId: string,
): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_listing_access").insert({
    listing_id: listingId,
    group_id: groupId,
    granted_by: ownerId,
  });
  return error?.message ?? null;
}

export async function revokeListingAccess(accessId: string): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_listing_access").delete().eq("id", accessId);
  return error?.message ?? null;
}

export async function fetchOwnerGroupsForGrant(
  ownerId: string,
  listingCity?: string | null,
): Promise<
  { id: string; name: string; slug: string; memberCount: number; targetMembers: number; city: string | null }[]
> {
  const { data: listings } = await getSupabase()
    .from("habitus_listings")
    .select("id, city")
    .eq("owner_profile_id", ownerId);

  if (!listings?.length) return [];

  const ownerCities = new Set(
    listings.map((l) => (l.city as string | null)?.toLowerCase()).filter(Boolean) as string[],
  );
  const cityFilter = listingCity?.toLowerCase() ?? null;

  let groupsQuery = getSupabase()
    .from("habitus_groups")
    .select("id, name, slug, target_members, city")
    .in("status", ["ready", "active"])
    .order("name")
    .limit(50);

  if (cityFilter) {
    groupsQuery = groupsQuery.ilike("city", cityFilter);
  } else if (ownerCities.size === 1) {
    groupsQuery = groupsQuery.ilike("city", [...ownerCities][0]);
  } else if (ownerCities.size > 1) {
    groupsQuery = groupsQuery.in("city", [...ownerCities]);
  }

  const { data: groups } = await groupsQuery;

  const result: {
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    targetMembers: number;
    city: string | null;
  }[] = [];
  for (const g of groups ?? []) {
    const { count } = await getSupabase()
      .from("habitus_group_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("group_id", g.id)
      .eq("is_confirmed", true);
    const memberCount = count ?? 0;
    const targetMembers = Number(g.target_members ?? 3);
    if (memberCount >= targetMembers) {
      result.push({
        id: g.id,
        name: g.name,
        slug: g.slug,
        memberCount,
        targetMembers,
        city: (g.city as string) ?? null,
      });
    }
  }
  return result;
}
