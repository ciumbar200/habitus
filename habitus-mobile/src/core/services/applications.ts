import { getSupabase } from "../client";
import { queueNotificationEvent } from "./notifications";
import {
  applicationStatusClass,
  applicationStatusLabel,
  formatAppliedDate,
} from "../lib/format";
import { imageUrlOrPlaceholder } from "../lib/media";
import type { Application } from "../types/models";

export type ApplicationDetail = Application & {
  listingSlug: string | null;
  location: string;
};

export async function fetchApplications(profileId: string): Promise<Application[]> {
  const { data, error } = await getSupabase()
    .from("habitus_applications")
    .select(`id, status, progress_percent, applied_at, habitus_listings (name, cover_image_url, slug, location, city)`)
    .eq("profile_id", profileId)
    .order("applied_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const listing = row.habitus_listings as unknown as {
      name: string;
      cover_image_url: string | null;
      slug?: string;
      location?: string;
      city?: string;
    } | null;
    const status = row.status as string;
    return {
      id: row.id,
      propertyName: listing?.name ?? "Espacio desconocido",
      propertyImage: imageUrlOrPlaceholder(listing?.cover_image_url ?? null),
      status: applicationStatusLabel(status),
      statusKey: status,
      statusClass: applicationStatusClass(status),
      date: formatAppliedDate(row.applied_at),
      progress: row.progress_percent ?? 0,
    };
  });
}

export async function createApplication(
  profileId: string,
  listingId: string,
  groupId?: string | null,
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    profile_id: profileId,
    listing_id: listingId,
    status: "submitted",
    progress_percent: 25,
    applied_at: new Date().toISOString(),
  };
  if (groupId) payload.group_id = groupId;

  const { error } = await getSupabase().from("habitus_applications").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tienes una solicitud activa para este espacio." };
    }
    if (error.code === "42703" || error.message.includes("group_id")) {
      const { error: fallbackErr } = await getSupabase().from("habitus_applications").insert({
        profile_id: profileId,
        listing_id: listingId,
        status: "submitted",
        progress_percent: 25,
        applied_at: new Date().toISOString(),
      });
      if (fallbackErr) {
        if (fallbackErr.code === "23505") {
          return { error: "Ya tienes una solicitud activa para este espacio." };
        }
        return { error: fallbackErr.message };
      }
      void queueNotificationEvent({
        type: "application_submitted",
        profileIds: [profileId],
        title: "Solicitud enviada",
        body: "Tu solicitud de alquiler ha sido registrada.",
      });
      return { error: null };
    }
    return { error: error.message };
  }

  void queueNotificationEvent({
    type: "application_submitted",
    profileIds: [profileId],
    title: "Solicitud enviada",
    body: "Tu solicitud de alquiler ha sido registrada.",
  });

  return { error: null };
}

export async function fetchApplicationById(
  profileId: string,
  applicationId: string,
): Promise<ApplicationDetail | null> {
  const { data, error } = await getSupabase()
    .from("habitus_applications")
    .select(
      `id, status, progress_percent, applied_at, habitus_listings (name, cover_image_url, slug, location, city)`,
    )
    .eq("profile_id", profileId)
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const listing = data.habitus_listings as unknown as {
    name: string;
    cover_image_url: string | null;
    slug: string;
    location: string;
    city: string;
  } | null;

  const status = data.status as string;
  const loc = listing
    ? [listing.location, listing.city].filter(Boolean).join(", ")
    : "";

  return {
    id: data.id,
    propertyName: listing?.name ?? "Espacio desconocido",
    propertyImage: imageUrlOrPlaceholder(listing?.cover_image_url ?? null),
    status: applicationStatusLabel(status),
    statusKey: status,
    statusClass: applicationStatusClass(status),
    date: formatAppliedDate(data.applied_at),
    progress: data.progress_percent ?? 0,
    listingSlug: listing?.slug ?? null,
    location: loc,
  };
}
