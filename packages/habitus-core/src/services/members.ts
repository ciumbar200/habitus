import { getSupabase } from "../client";
import { imageUrlOrPlaceholder } from "../lib/media";
import { isUuidLike } from "../lib/profileSlug";
import {
  computeCompatibility,
  computeHostTenantCompatibility,
  resolveQuizAnswers,
} from "./compatibility";
import type { CompatQuizAnswers } from "../types/compatibility";
import type { AccountRoleSlug, IdentityStatus, Roommate } from "../types/models";
import type { CompatibilityResult } from "../types/compatibility";

export type PublicMember = {
  slug: string;
  uuid?: string;
  name: string;
  roleTitle: string;
  accountRole: AccountRoleSlug | null;
  bio: string;
  image: string;
  tags: string[];
  compatibility: number;
  compatibilityResult?: CompatibilityResult;
  matchLabel: string;
  isDemo: boolean;
  identityStatus: IdentityStatus;
};

type ShowcaseRow = {
  id: string;
  slug: string;
  display_name: string;
  role_title: string | null;
  avatar_url: string | null;
  bio_quote: string | null;
  compatibility_score: number | null;
  compat_quiz: CompatQuizAnswers | null;
  account_role: string | null;
  showcase_member_tags: { tag: string }[];
};

type ProfileRow = {
  id: string;
  slug: string | null;
  display_name: string;
  role_title: string | null;
  avatar_url: string | null;
  bio_quote: string | null;
  profile_score: number;
  compat_quiz: CompatQuizAnswers | null;
  account_role: string | null;
};

function mapShowcase(
  m: ShowcaseRow,
  selfQuiz: CompatQuizAnswers,
  viewerRole?: AccountRoleSlug,
): Roommate {
  const otherQuiz = resolveQuizAnswers(
    m.compat_quiz as CompatQuizAnswers,
    m.slug,
  );
  const otherIsHost = m.account_role === "anfitrion";
  const viewerIsHost = viewerRole === "anfitrion";

  let result: CompatibilityResult;
  let kind: "roommate" | "host_tenant";

  if (viewerIsHost && !otherIsHost) {
    result = computeHostTenantCompatibility(selfQuiz, otherQuiz);
    kind = "host_tenant";
  } else if (!viewerIsHost && otherIsHost) {
    result = computeHostTenantCompatibility(otherQuiz, selfQuiz);
    kind = "host_tenant";
  } else {
    result = computeCompatibility(selfQuiz, otherQuiz, "roommate");
    kind = "roommate";
  }

  return {
    id: m.slug,
    slug: m.slug,
    uuid: m.id,
    name: m.display_name,
    role: m.role_title ?? "",
    compatibility: result.overall,
    compatibilityResult: result,
    matchKind: kind,
    image: imageUrlOrPlaceholder(m.avatar_url),
    tags: (m.showcase_member_tags ?? []).map((t) => t.tag),
    quote: m.bio_quote ?? "",
    isDemo: true,
  };
}

function mapProfile(p: ProfileRow, selfQuiz: CompatQuizAnswers, kind: "roommate" | "host_tenant"): Roommate {
  const otherQuiz = resolveQuizAnswers(p.compat_quiz as CompatQuizAnswers);
  const result =
    kind === "host_tenant"
      ? computeHostTenantCompatibility(selfQuiz, otherQuiz)
      : computeCompatibility(selfQuiz, otherQuiz, "roommate");

  return {
    id: p.id,
    slug: p.slug ?? p.id,
    uuid: p.id,
    name: p.display_name,
    role: p.role_title ?? "",
    compatibility: result.overall,
    compatibilityResult: result,
    matchKind: kind,
    image: imageUrlOrPlaceholder(p.avatar_url),
    tags: [],
    quote: p.bio_quote ?? "",
    isDemo: false,
  };
}

export async function fetchShowcaseMembers(
  selfQuiz: CompatQuizAnswers,
  filter?: "roommate" | "host",
  viewerRole?: AccountRoleSlug,
): Promise<Roommate[]> {
  const { data, error } = await getSupabase()
    .from("showcase_members")
    .select(
      `id, slug, display_name, role_title, avatar_url, bio_quote, compatibility_score, compat_quiz, account_role,
       showcase_member_tags (tag)`,
    )
    .order("compatibility_score", { ascending: false });

  if (error) throw error;

  let rows = (data ?? []) as ShowcaseRow[];
  if (filter === "roommate") {
    rows = rows.filter((m) => (m.account_role ?? "inquilino") === "inquilino");
  }
  if (filter === "host") {
    rows = rows.filter((m) => m.account_role === "anfitrion");
  }

  return rows.map((m) => mapShowcase(m, selfQuiz, viewerRole)).sort((a, b) => b.compatibility - a.compatibility);
}

export async function fetchRoommateMatches(
  userId: string,
  selfQuiz: CompatQuizAnswers,
): Promise<Roommate[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, slug, display_name, role_title, avatar_url, bio_quote, profile_score, compat_quiz, account_role",
    )
    .eq("is_discoverable", true)
    .eq("account_role", "inquilino")
    .neq("id", userId);

  if (error) throw error;

  return ((data ?? []) as ProfileRow[])
    .map((p) => mapProfile(p, selfQuiz, "roommate"))
    .filter((r) => r.compatibility >= 50)
    .sort((a, b) => b.compatibility - a.compatibility);
}

export async function fetchHostMatchesForInquilino(
  selfQuiz: CompatQuizAnswers,
): Promise<Roommate[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, slug, display_name, role_title, avatar_url, bio_quote, profile_score, compat_quiz, account_role",
    )
    .eq("account_role", "anfitrion");

  if (error) throw error;

  return ((data ?? []) as ProfileRow[])
    .map((p) => mapProfile(p, selfQuiz, "host_tenant"))
    .sort((a, b) => b.compatibility - a.compatibility);
}

export async function fetchCompatibleInquilinosForHost(
  hostId: string,
  hostQuiz: CompatQuizAnswers,
): Promise<Roommate[]> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, slug, display_name, role_title, avatar_url, bio_quote, profile_score, compat_quiz, account_role",
    )
    .eq("is_discoverable", true)
    .eq("account_role", "inquilino")
    .neq("id", hostId);

  if (error) throw error;

  return ((data ?? []) as ProfileRow[])
    .map((p) => {
      const otherQuiz = resolveQuizAnswers(p.compat_quiz as CompatQuizAnswers);
      const result = computeHostTenantCompatibility(hostQuiz, otherQuiz);
      return {
        id: p.id,
        slug: p.slug ?? p.id,
        uuid: p.id,
        name: p.display_name,
        role: p.role_title ?? "",
        compatibility: result.overall,
        compatibilityResult: result,
        matchKind: "host_tenant" as const,
        image: imageUrlOrPlaceholder(p.avatar_url),
        tags: [],
        quote: p.bio_quote ?? "",
        isDemo: false,
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility);
}

/** Inquilinos compatibles con un anfitrión (perfiles reales + demo showcase). */
export async function fetchInquilinoMatchesForHost(
  hostId: string,
  hostQuiz: CompatQuizAnswers,
): Promise<Roommate[]> {
  const [live, showcase] = await Promise.all([
    fetchCompatibleInquilinosForHost(hostId, hostQuiz),
    fetchShowcaseMembers(hostQuiz, "roommate", "anfitrion"),
  ]);
  const byKey = new Map<string, Roommate>();
  for (const r of [...live, ...showcase]) {
    byKey.set(r.uuid ?? r.slug, r);
  }
  return [...byKey.values()].sort((a, b) => b.compatibility - a.compatibility);
}

export async function fetchPublicMember(
  slug: string,
  selfQuiz: CompatQuizAnswers,
): Promise<PublicMember | null> {
  const { data: showcase } = await getSupabase()
    .from("showcase_members")
    .select(
      `id, slug, display_name, role_title, avatar_url, bio_quote, compat_quiz, account_role,
       showcase_member_tags (tag)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (showcase) {
    const row = showcase as ShowcaseRow;
    const otherQuiz = resolveQuizAnswers(row.compat_quiz as CompatQuizAnswers, slug);
    const isHost = row.account_role === "anfitrion";
    const result = isHost
      ? computeHostTenantCompatibility(otherQuiz, selfQuiz)
      : computeCompatibility(selfQuiz, otherQuiz, "roommate");
    return {
      slug: row.slug,
      uuid: row.id,
      name: row.display_name,
      roleTitle: row.role_title ?? "",
      accountRole: (row.account_role as AccountRoleSlug) ?? "inquilino",
      bio: row.bio_quote ?? "",
      image: imageUrlOrPlaceholder(row.avatar_url),
      tags: (row.showcase_member_tags ?? []).map((t) => t.tag),
      compatibility: result.overall,
      compatibilityResult: result,
      matchLabel: isHost ? "afinidad con anfitrión" : "afinidad de convivencia",
      isDemo: true,
      identityStatus: "verified",
    };
  }

  const { data: profileBySlug } = await getSupabase()
    .from("habitus_profiles")
    .select(
      "id, slug, display_name, role_title, avatar_url, bio_quote, compat_quiz, account_role, identity_status",
    )
    .eq("slug", slug)
    .maybeSingle();

  let profile = profileBySlug;

  if (!profile && isUuidLike(slug)) {
    const { data: profileById } = await getSupabase()
      .from("habitus_profiles")
      .select(
        "id, slug, display_name, role_title, avatar_url, bio_quote, compat_quiz, account_role, identity_status",
      )
      .eq("id", slug)
      .maybeSingle();
    profile = profileById;
  }

  if (!profile) return null;

  const p = profile as ProfileRow & { identity_status?: string };
  const isPublisher = p.account_role === "propietario" || p.account_role === "agencia";
  const tagRows = isPublisher
    ? { data: [] as { tag: string }[] }
    : await getSupabase().from("habitus_profile_tags").select("tag").eq("profile_id", p.id);
  const tags = (tagRows.data ?? []).map((t) => t.tag);
  const otherQuiz = resolveQuizAnswers(p.compat_quiz as CompatQuizAnswers);
  const isHost = p.account_role === "anfitrion";
  const result = isPublisher
    ? null
    : isHost
      ? computeHostTenantCompatibility(otherQuiz, selfQuiz)
      : computeCompatibility(selfQuiz, otherQuiz, "roommate");

  return {
    slug: p.slug ?? p.id,
    uuid: p.id,
    name: p.display_name,
    roleTitle: p.role_title ?? "",
    accountRole: p.account_role as AccountRoleSlug,
    bio: p.bio_quote ?? "",
    image: imageUrlOrPlaceholder(p.avatar_url),
    tags,
    compatibility: result?.overall ?? 0,
    compatibilityResult: result ?? undefined,
    matchLabel: isHost ? "afinidad con anfitrión" : "afinidad de convivencia",
    isDemo: false,
    identityStatus: (p.identity_status ?? "none") as IdentityStatus,
  };
}

/** @deprecated use fetchRoommateMatches */
export async function fetchVerifiedMembers(
  excludeUserId?: string,
  selfQuiz: CompatQuizAnswers = {},
): Promise<Roommate[]> {
  if (!excludeUserId) return [];
  return fetchRoommateMatches(excludeUserId, selfQuiz);
}
