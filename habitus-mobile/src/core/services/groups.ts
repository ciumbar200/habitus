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

export type PublicGroupPreview = {
  slug: string;
  name: string;
  city: string | null;
  status: LivingGroup["status"];
  targetMembers: number;
  confirmedCount: number;
  spotsLeft: number;
};

/** Grupo formado = listo para solicitar o activo. */
export function isGroupFormed(group: Pick<LivingGroup, "status" | "memberCount" | "targetMembers">): boolean {
  if (group.status === "ready" || group.status === "active") return true;
  return group.memberCount >= group.targetMembers;
}

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

async function confirmedCountsByGroup(groupIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!groupIds.length) return counts;

  const { data } = await getSupabase()
    .from("habitus_group_members")
    .select("group_id")
    .in("group_id", groupIds)
    .eq("is_confirmed", true);

  for (const m of data ?? []) {
    counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  }
  return counts;
}

export type MyGroupEntry = LivingGroup & {
  membershipConfirmed: boolean;
  membershipPending: boolean;
};

export async function fetchMyGroupsWithMembership(profileId: string): Promise<MyGroupEntry[]> {
  const { data: memberships, error: mErr } = await getSupabase()
    .from("habitus_group_members")
    .select("group_id, is_confirmed")
    .eq("profile_id", profileId);

  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const confirmedByGroup = new Map<string, boolean>();
  for (const m of memberships) {
    confirmedByGroup.set(m.group_id, Boolean(m.is_confirmed));
  }

  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .select("id, slug, name, creator_id, listing_id, city, status, target_members, notes, created_at")
    .in("id", groupIds)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const counts = await confirmedCountsByGroup(groupIds);
  return (data ?? []).map((r) => {
    const confirmed = confirmedByGroup.get(r.id as string) ?? false;
    return {
      ...mapGroup(r as Record<string, unknown>, counts.get(r.id as string) ?? 0),
      membershipConfirmed: confirmed,
      membershipPending: !confirmed,
    };
  });
}

export async function fetchMyGroups(profileId: string): Promise<LivingGroup[]> {
  const entries = await fetchMyGroupsWithMembership(profileId);
  return entries.map(({ membershipConfirmed: _c, membershipPending: _p, ...group }) => group);
}

/** Grupos formados del inquilino (ready/active) para solicitar un piso. */
export async function fetchMyFormedGroups(profileId: string): Promise<LivingGroup[]> {
  const groups = await fetchMyGroups(profileId);
  return groups.filter((g) => isGroupFormed(g));
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
    .eq("group_id", data.id)
    .eq("is_confirmed", true);

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

export async function fetchPendingGroupRequests(groupId: string): Promise<LivingGroupMember[]> {
  const members = await fetchGroupMembers(groupId);
  return members.filter((m) => !m.isConfirmed);
}

export async function fetchConfirmedGroupMembers(groupId: string): Promise<LivingGroupMember[]> {
  const members = await fetchGroupMembers(groupId);
  return members.filter((m) => m.isConfirmed);
}

export async function fetchGroupsForProfile(profileId: string): Promise<LivingGroup[]> {
  return fetchMyGroups(profileId);
}

/** Solo grupos formados (ready/active) para perfil público — solo membresía confirmada. */
export async function fetchPublicGroupsForProfile(profileId: string): Promise<LivingGroup[]> {
  const { data: memberships, error: mErr } = await getSupabase()
    .from("habitus_group_members")
    .select("group_id")
    .eq("profile_id", profileId)
    .eq("is_confirmed", true);

  if (mErr) throw mErr;
  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (!groupIds.length) return [];

  const { data, error } = await getSupabase()
    .from("habitus_groups")
    .select("id, slug, name, creator_id, listing_id, city, status, target_members, notes, created_at")
    .in("id", groupIds)
    .in("status", ["ready", "active"]);

  if (error) throw error;
  const counts = await confirmedCountsByGroup(groupIds);
  return (data ?? []).map((r) => mapGroup(r as Record<string, unknown>, counts.get(r.id as string) ?? 0));
}

export async function fetchPublicGroupPreview(slug: string): Promise<PublicGroupPreview | null> {
  const { data, error } = await getSupabase().rpc("habitus_public_group_preview", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    slug: row.slug as string,
    name: row.name as string,
    city: (row.city as string) ?? null,
    status: row.status as LivingGroup["status"],
    targetMembers: Number(row.targetMembers ?? 3),
    confirmedCount: Number(row.confirmedCount ?? 0),
    spotsLeft: Number(row.spotsLeft ?? 0),
  };
}

export async function requestJoinGroup(groupId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_request_join_group", {
    p_group_id: groupId,
  });
  if (error) return error.message;
  return (data as string | null) ?? null;
}

export async function acceptGroupMember(groupId: string, profileId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_accept_group_member", {
    p_group_id: groupId,
    p_profile_id: profileId,
  });
  if (error) return error.message;
  return (data as string | null) ?? null;
}

export async function rejectGroupMember(groupId: string, profileId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("habitus_reject_group_member", {
    p_group_id: groupId,
    p_profile_id: profileId,
  });
  if (error) return error.message;
  return (data as string | null) ?? null;
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
