import { getSupabase } from "../client";
import type { CompatQuizAnswers } from "../types/compatibility";
import {
  fetchCompatibleInquilinosForHost,
  fetchInquilinoMatchesForHost,
} from "./members";

export type ManagerFormedGroup = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone: string | null;
  status: string;
  targetMembers: number;
  memberCount: number;
};

export type ManagerGroupMember = {
  profileId: string;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  groupRole: string;
  isConfirmed: boolean;
  joinedAt: string;
};

export async function fetchFormedGroupsForManager(
  city?: string | null,
): Promise<ManagerFormedGroup[]> {
  const { data, error } = await getSupabase().rpc("habitus_formed_groups_for_manager", {
    p_city: city ?? null,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data)) return [];
  return data as ManagerFormedGroup[];
}

export async function fetchManagerGroupMembers(groupId: string): Promise<ManagerGroupMember[]> {
  const { data, error } = await getSupabase().rpc("habitus_manager_group_members", {
    p_group_id: groupId,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data)) return [];
  return data as ManagerGroupMember[];
}

/** Inquilinos descubribles compatibles — misma lógica que anfitrión. */
export async function fetchInquilinoMatchesForManager(
  managerId: string,
  managerQuiz: CompatQuizAnswers,
) {
  return fetchInquilinoMatchesForHost(managerId, managerQuiz);
}

export async function fetchCompatibleInquilinosForManager(
  managerId: string,
  managerQuiz: CompatQuizAnswers,
) {
  return fetchCompatibleInquilinosForHost(managerId, managerQuiz);
}
