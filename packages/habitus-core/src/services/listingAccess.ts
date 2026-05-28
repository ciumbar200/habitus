import { getSupabase } from "../client";
import type { ListingAccessGrant } from "../types/models";
import {
  fetchConfirmedGroupMemberIds,
  notifyListingAccessGranted,
} from "./notifications";

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
  if (error) return error.message;

  const [{ data: listing }, { data: group }, memberIds] = await Promise.all([
    getSupabase().from("habitus_listings").select("name").eq("id", listingId).maybeSingle(),
    getSupabase().from("habitus_groups").select("name").eq("id", groupId).maybeSingle(),
    fetchConfirmedGroupMemberIds(groupId),
  ]);

  void notifyListingAccessGranted({
    listingId,
    listingName: (listing?.name as string) ?? "un piso privado",
    groupId,
    groupName: (group?.name as string) ?? "tu grupo",
    memberProfileIds: memberIds,
  });

  return null;
}

export async function grantListingAccessToProfile(
  listingId: string,
  profileId: string,
  ownerId: string,
): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_listing_access").insert({
    listing_id: listingId,
    profile_id: profileId,
    granted_by: ownerId,
  });
  return error?.message ?? null;
}

export async function revokeListingAccess(accessId: string): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_listing_access").delete().eq("id", accessId);
  return error?.message ?? null;
}

export async function fetchOwnerGroupsForGrant(
  _ownerId: string,
  listingCity?: string | null,
): Promise<
  { id: string; name: string; slug: string; memberCount: number; targetMembers: number; city: string | null }[]
> {
  const { data, error } = await getSupabase().rpc("habitus_formed_groups_for_manager", {
    p_city: listingCity ?? null,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data)) return [];

  return (data as {
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    targetMembers: number;
    city: string | null;
  }[]).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    memberCount: g.memberCount,
    targetMembers: g.targetMembers,
    city: g.city ?? null,
  }));
}
