import { getSupabase } from "../client";
import { notifyLeasePendingSignature } from "./notifications";

export type LeaseStatus = "draft" | "pending_signatures" | "active" | "ended" | "cancelled";

export type Lease = {
  id: string;
  listingId: string;
  groupId: string | null;
  applicationId: string | null;
  ownerId: string;
  status: LeaseStatus;
  startDate: string | null;
  endDate: string | null;
  monthlyRent: number | null;
  depositAmount: number | null;
  contractPdfUrl: string | null;
  listingName?: string;
  listingSlug?: string;
  createdAt: string;
};

export type LeaseParty = {
  id: string;
  leaseId: string;
  profileId: string;
  partyRole: "tenant" | "owner" | "host" | "guarantor";
  signedAt: string | null;
  displayName?: string;
};

function mapLease(row: Record<string, unknown>): Lease {
  const listing = row.habitus_listings as { name: string; slug: string } | null;
  return {
    id: row.id as string,
    listingId: row.listing_id as string,
    groupId: (row.group_id as string) ?? null,
    applicationId: (row.application_id as string) ?? null,
    ownerId: row.owner_id as string,
    status: row.status as LeaseStatus,
    startDate: (row.start_date as string) ?? null,
    endDate: (row.end_date as string) ?? null,
    monthlyRent: row.monthly_rent != null ? Number(row.monthly_rent) : null,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : null,
    contractPdfUrl: (row.contract_pdf_url as string) ?? null,
    listingName: listing?.name,
    listingSlug: listing?.slug,
    createdAt: row.created_at as string,
  };
}

export async function fetchMyLeases(profileId: string): Promise<Lease[]> {
  const { data: parties } = await getSupabase()
    .from("habitus_lease_parties")
    .select("lease_id")
    .eq("profile_id", profileId);

  const partyLeaseIds = (parties ?? []).map((p) => p.lease_id);

  let query = getSupabase()
    .from("habitus_leases")
    .select(
      `id, listing_id, group_id, application_id, owner_id, status, start_date, end_date,
       monthly_rent, deposit_amount, contract_pdf_url, created_at,
       habitus_listings (name, slug)`,
    )
    .order("created_at", { ascending: false });

  if (partyLeaseIds.length) {
    query = query.or(`owner_id.eq.${profileId},id.in.(${partyLeaseIds.join(",")})`);
  } else {
    query = query.eq("owner_id", profileId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapLease(r as Record<string, unknown>));
}

export async function fetchLeaseParties(leaseId: string): Promise<LeaseParty[]> {
  const { data, error } = await getSupabase()
    .from("habitus_lease_parties")
    .select(
      `id, lease_id, profile_id, party_role, signed_at,
       habitus_profiles (display_name)`,
    )
    .eq("lease_id", leaseId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const p = row.habitus_profiles as unknown as { display_name: string } | null;
    return {
      id: row.id,
      leaseId: row.lease_id,
      profileId: row.profile_id,
      partyRole: row.party_role,
      signedAt: row.signed_at,
      displayName: p?.display_name,
    };
  });
}

export async function createLeaseDraft(input: {
  listingId: string;
  ownerId: string;
  groupId?: string | null;
  applicationId?: string | null;
  monthlyRent?: number;
  depositAmount?: number;
  tenantProfileIds: string[];
}): Promise<{ leaseId: string | null; error: string | null }> {
  const { data: lease, error } = await getSupabase()
    .from("habitus_leases")
    .insert({
      listing_id: input.listingId,
      owner_id: input.ownerId,
      group_id: input.groupId ?? null,
      application_id: input.applicationId ?? null,
      monthly_rent: input.monthlyRent ?? null,
      deposit_amount: input.depositAmount ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { leaseId: null, error: error.message };

  const parties = [
    { lease_id: lease.id, profile_id: input.ownerId, party_role: "owner" },
    ...input.tenantProfileIds.map((id) => ({
      lease_id: lease.id,
      profile_id: id,
      party_role: "tenant" as const,
    })),
  ];

  const { error: partyErr } = await getSupabase().from("habitus_lease_parties").insert(parties);
  if (partyErr) return { leaseId: null, error: partyErr.message };

  return { leaseId: lease.id, error: null };
}

export async function updateLeaseStatus(
  leaseId: string,
  status: LeaseStatus,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_leases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leaseId);

  if (error) return error.message;

  if (status === "pending_signatures") {
    const [{ data: lease }, { data: parties }] = await Promise.all([
      getSupabase()
        .from("habitus_leases")
        .select("listing_id, habitus_listings (name)")
        .eq("id", leaseId)
        .maybeSingle(),
      getSupabase()
        .from("habitus_lease_parties")
        .select("profile_id")
        .eq("lease_id", leaseId),
    ]);

    const listing = lease?.habitus_listings as unknown as { name: string } | null;
    const partyIds = (parties ?? []).map((p) => p.profile_id as string);

    if (partyIds.length) {
      void notifyLeasePendingSignature({
        leaseId,
        listingName: listing?.name ?? "tu contrato",
        partyProfileIds: partyIds,
      });
    }
  }

  return null;
}

export async function markPartySigned(leaseId: string, profileId: string): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_lease_parties")
    .update({ signed_at: new Date().toISOString() })
    .eq("lease_id", leaseId)
    .eq("profile_id", profileId);
  return error?.message ?? null;
}
