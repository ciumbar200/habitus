import { getSupabase } from "../client";
import { slugify } from "../lib/slug";
import type { LivingGroup, LivingGroupMember } from "../types/models";

export type CreateGroupInput = {
  name: string;
  city?: string;
  targetMembers?: number;
  notes?: string;
};

export type FairSplitLine = {
  profileId: string;
  displayName: string;
  roomLabel: string;
  amount: number;
  weight: number;
};

/** Reparto proporcional por pesos de habitación (demo Moon-style). */
export function computeFairSplit(
  totalRent: number,
  members: { profileId: string; displayName: string; roomLabel?: string; weight?: number }[],
): FairSplitLine[] {
  if (!members.length || totalRent <= 0) return [];
  const withWeights = members.map((m, i) => ({
    ...m,
    weight: m.weight ?? (members.length - i),
    roomLabel: m.roomLabel ?? `Habitación ${i + 1}`,
  }));
  const sum = withWeights.reduce((s, m) => s + m.weight, 0);
  return withWeights.map((m) => ({
    profileId: m.profileId,
    displayName: m.displayName,
    roomLabel: m.roomLabel,
    weight: m.weight,
    amount: Math.round((totalRent * m.weight) / sum),
  }));
}

function mapGroup(row: Record<string, unknown>, memberCount = 0): LivingGroup {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    creatorId: row.creator_id as string,
    listingId: (row.listing_id as string) ?? null,
    city: (row.city as string) ?? null,
    status: row.status as LivingGroup["status"],
    targetMembers: Number(row.target_members ?? 3),
    notes: (row.notes as string) ?? null,
    memberCount,
    createdAt: row.created_at as string,
  };
}

export async function fetchMyGroups(profileId: string): Promise<LivingGroup[]> {
  const { data: memberships, error: mErr } = await getSupabase()
    .from("habitus_group_members")
    .select("group_id")
    .eq("profile_id", profileId);

  if (mErr) throw mErr;
  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (!groupIds.length) return [];

  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .select("id, slug, name, creator_id, listing_id, city, status, target_members, notes, created_at")
    .in("id", groupIds)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const { data: allMembers } = await getSupabase()
    .from("habitus_group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const counts = new Map<string, number>();
  for (const m of allMembers ?? []) {
    counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  }

  return (data ?? []).map((r) => mapGroup(r as Record<string, unknown>, counts.get(r.id as string) ?? 0));
}

export async function fetchGroupBySlug(slug: string): Promise<LivingGroup | null> {
  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .select("id, slug, name, creator_id, listing_id, city, status, target_members, notes, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { count } = await getSupabase()
    .from("habitus_group_members")
    .select("profile_id", { count: "exact", head: true })
    .eq("group_id", data.id);

  return mapGroup(data as Record<string, unknown>, count ?? 0);
}

export async function fetchGroupMembers(groupId: string): Promise<LivingGroupMember[]> {
  const { data, error } = await getSupabase()
    .from("habitus_group_members")
    .select(
      `profile_id, role, room_label, share_amount, is_confirmed, joined_at,
       habitus_profiles (id, slug, display_name, avatar_url, identity_status, role_title)`,
    )
    .eq("group_id", groupId)
    .order("joined_at");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const p = row.habitus_profiles as unknown as {
      id: string;
      slug: string | null;
      display_name: string;
      avatar_url: string | null;
      identity_status: string;
      role_title: string | null;
    } | null;
    return {
      profileId: row.profile_id as string,
      slug: p?.slug ?? row.profile_id,
      displayName: p?.display_name ?? "Miembro",
      avatarUrl: p?.avatar_url ?? null,
      identityStatus: (p?.identity_status ?? "none") as LivingGroupMember["identityStatus"],
      roleTitle: p?.role_title ?? null,
      groupRole: row.role as LivingGroupMember["groupRole"],
      roomLabel: (row.room_label as string) ?? null,
      shareAmount: row.share_amount != null ? Number(row.share_amount) : null,
      isConfirmed: Boolean(row.is_confirmed),
      joinedAt: row.joined_at as string,
    };
  });
}

export async function fetchGroupsForProfile(profileId: string): Promise<LivingGroup[]> {
  return fetchMyGroups(profileId);
}

export async function createGroup(
  creatorId: string,
  input: CreateGroupInput,
): Promise<{ group: LivingGroup | null; error: string | null }> {
  const baseSlug = slugify(input.name) || "grupo";
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .insert({
      slug,
      name: input.name.trim(),
      creator_id: creatorId,
      city: input.city ?? null,
      target_members: input.targetMembers ?? 3,
      notes: input.notes ?? null,
      status: "forming",
    })
    .select("id, slug, name, creator_id, listing_id, city, status, target_members, notes, created_at")
    .single();

  if (error) return { group: null, error: error.message };

  const group = mapGroup(data as Record<string, unknown>, 1);

  const { error: memberErr } = await getSupabase().from("habitus_group_members").insert({
    group_id: group.id,
    profile_id: creatorId,
    role: "lead",
    is_confirmed: true,
  });

  if (memberErr) return { group: null, error: memberErr.message };
  return { group, error: null };
}

export async function updateMemberShare(
  groupId: string,
  profileId: string,
  roomLabel: string,
  shareAmount: number,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_group_members")
    .update({ room_label: roomLabel, share_amount: shareAmount })
    .eq("group_id", groupId)
    .eq("profile_id", profileId);
  return error?.message ?? null;
}

export async function setGroupStatus(
  groupId: string,
  status: LivingGroup["status"],
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_groups")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", groupId);
  return error?.message ?? null;
}
