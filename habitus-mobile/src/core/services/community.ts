import { getSupabase } from "../client";
import type { CommunityEvent } from "../types/models";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
  max_attendees: number | null;
};

function mapEvent(row: EventRow): CommunityEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    city: row.city,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    coverImageUrl: row.cover_image_url,
    maxAttendees: row.max_attendees,
  };
}

export async function fetchCommunityEvents(city?: string): Promise<CommunityEvent[]> {
  let q = getSupabase()
    .from("habitus_community_events")
    .select("id, slug, title, description, city, location, starts_at, ends_at, cover_image_url, max_attendees")
    .eq("is_published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (city) q = q.eq("city", city);

  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as EventRow[]).map(mapEvent);
}

export async function fetchCommunityEventBySlug(slug: string): Promise<CommunityEvent | null> {
  const { data, error } = await getSupabase()
    .from("habitus_community_events")
    .select("id, slug, title, description, city, location, starts_at, ends_at, cover_image_url, max_attendees")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapEvent(data as EventRow);
}
