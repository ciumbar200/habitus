import { getSupabase } from "../client";

export async function fetchListingBookmarkSlugs(profileId: string): Promise<Set<string>> {
  const { data, error } = await getSupabase()
    .from("habitus_listing_bookmarks")
    .select("listing_id, habitus_listings (slug)")
    .eq("profile_id", profileId);

  if (error) throw error;
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    const listing = row.habitus_listings as unknown as { slug: string } | null;
    if (listing?.slug) slugs.add(listing.slug);
  }
  return slugs;
}

export async function fetchShowcaseBookmarkSlugs(profileId: string): Promise<Set<string>> {
  const { data, error } = await getSupabase()
    .from("habitus_showcase_bookmarks")
    .select("showcase_member_id, showcase_members (slug)")
    .eq("profile_id", profileId);

  if (error) throw error;
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    const m = row.showcase_members as unknown as { slug: string } | null;
    if (m?.slug) slugs.add(m.slug);
  }
  return slugs;
}

export async function toggleListingBookmark(
  profileId: string,
  listingUuid: string,
  isBookmarked: boolean,
): Promise<void> {
  if (isBookmarked) {
    const { error } = await getSupabase()
      .from("habitus_listing_bookmarks")
      .delete()
      .eq("profile_id", profileId)
      .eq("listing_id", listingUuid);
    if (error) throw error;
  } else {
    const { error } = await getSupabase()
      .from("habitus_listing_bookmarks")
      .insert({ profile_id: profileId, listing_id: listingUuid });
    if (error) throw error;
  }
}

export async function toggleShowcaseBookmark(
  profileId: string,
  showcaseMemberUuid: string,
  isBookmarked: boolean,
): Promise<void> {
  if (isBookmarked) {
    const { error } = await getSupabase()
      .from("habitus_showcase_bookmarks")
      .delete()
      .eq("profile_id", profileId)
      .eq("showcase_member_id", showcaseMemberUuid);
    if (error) throw error;
  } else {
    const { error } = await getSupabase()
      .from("habitus_showcase_bookmarks")
      .insert({ profile_id: profileId, showcase_member_id: showcaseMemberUuid });
    if (error) throw error;
  }
}

export async function getShowcaseUuidBySlug(slug: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("showcase_members")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}
