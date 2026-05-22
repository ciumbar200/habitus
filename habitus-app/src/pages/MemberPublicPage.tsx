import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CompatibilityScore } from "../components/CompatibilityScore";
import { IdentityBadge } from "../components/IdentityBadge";
import { LivingGroupCard } from "../components/LivingGroupCard";
import { Icon } from "../components/Icon";
import { LoadingState, ErrorState } from "../components/PageState";
import { PropertyCard } from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import {
  accountRoleLabel,
  es,
  fetchCompatQuiz,
  fetchGroupsForProfile,
  fetchListingsByHost,
  fetchListingsByOwner,
  fetchPublicMember,
  roleShowsLifestyleProfile,
  roleShowsTrustProfile,
  startConversationWith,
  type LivingGroup,
  type Property,
  type PublicMember,
} from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function MemberPublicPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [member, setMember] = useState<PublicMember | null>(null);
  const [hostListings, setHostListings] = useState<Property[]>([]);
  const [ownerListings, setOwnerListings] = useState<Property[]>([]);
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError(es.member.notFound);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});

    quizPromise
      .then((quiz) => fetchPublicMember(slug, quiz))
      .then(async (m) => {
        if (!m) {
          setError(es.member.notFound);
          return;
        }
        setMember(m);
        const tasks: Promise<void>[] = [];
        if (m.uuid && m.accountRole === "anfitrion") {
          tasks.push(fetchListingsByHost(m.uuid).then(setHostListings));
        }
        if (m.uuid && roleShowsTrustProfile(m.accountRole)) {
          tasks.push(fetchListingsByOwner(m.uuid).then(setOwnerListings));
        }
        if (m.uuid && !m.isDemo) {
          tasks.push(fetchGroupsForProfile(m.uuid).then(setGroups));
        }
        await Promise.all(tasks);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  async function handleChat() {
    if (!user) {
      navigate("/access");
      return;
    }
    if (!member || member.isDemo) {
      setHint(es.matches.demoChatHint);
      return;
    }
    const otherId = member.uuid;
    if (!otherId) return;

    setChatLoading(true);
    setHint(null);
    try {
      const convId = await startConversationWith(otherId);
      navigate(`/messages?c=${convId}`);
    } catch {
      setHint(es.matches.chatError);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <ErrorState message={error ?? es.member.notFound} />
        <Link to="/matches" className="mt-4 inline-flex text-teal-accent hover:underline">
          {es.common.back}
        </Link>
      </main>
    );
  }

  const showLifestyle = roleShowsLifestyleProfile(member.accountRole);
  const showTrust = roleShowsTrustProfile(member.accountRole);

  return (
    <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <div className="overflow-hidden rounded-2xl border border-border-light bg-surface-container-lowest card-shadow">
        <div className="relative h-80">
          <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
          <div className="absolute top-4 left-4">
            {showLifestyle && member.compatibilityResult ? (
              <CompatibilityScore
                score={member.compatibility}
                result={member.compatibilityResult}
                label={member.matchLabel}
                variant="gradient"
              />
            ) : (
              <IdentityBadge status={member.identityStatus} />
            )}
          </div>
          {member.isDemo && (
            <span className="absolute top-4 right-4 rounded-full bg-surface/90 px-3 py-1 text-label-sm text-warm-slate backdrop-blur-md">
              {es.matches.demoProfile}
            </span>
          )}
        </div>

        <div className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-headline-lg text-deep-navy">{member.name}</h1>
              <p className="mt-1 text-label-md text-teal-accent">{member.roleTitle}</p>
              {member.accountRole && (
                <p className="mt-1 text-label-sm text-warm-slate">
                  {accountRoleLabel(member.accountRole)}
                </p>
              )}
            </div>
            <IdentityBadge status={member.identityStatus} />
          </div>

          {member.identityStatus === "verified" && (
            <p className="mt-4 text-body-sm text-warm-slate">
              {showTrust ? es.member.trustHint : es.member.verifiedHint}
            </p>
          )}

          {showLifestyle && member.tags.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-label-md uppercase tracking-wider text-teal-accent">
                {es.member.lifestyle}
              </h2>
              <div className="flex flex-wrap gap-2">
                {member.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-surface-container px-3 py-1 text-label-sm text-deep-navy"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.bio && (
            <blockquote className="mt-6 border-l-4 border-teal-accent pl-4 text-body-lg italic text-warm-slate">
              &ldquo;{member.bio}&rdquo;
            </blockquote>
          )}

          {showLifestyle && member.compatibilityResult && (
            <div className="mt-6">
              <CompatibilityScore
                score={member.compatibility}
                result={member.compatibilityResult}
                label={member.matchLabel}
                defaultOpen
                className="w-full"
              />
            </div>
          )}

          {hint && (
            <p className="mt-4 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
              {hint}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={chatLoading}
              onClick={handleChat}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-deep-navy py-3 text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Icon name="chat_bubble" className="text-[20px]" />
              {chatLoading ? es.common.pleaseWait : es.matches.startChat}
            </button>
            <Link
              to="/matches"
              className="flex h-12 items-center justify-center rounded-lg border border-border-light px-6 text-label-md text-deep-navy hover:bg-surface-container"
            >
              {es.common.back}
            </Link>
          </div>
        </div>
      </div>

      {groups.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.member.groups}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <LivingGroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      {hostListings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.member.hostSpaces}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {hostListings.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        </section>
      )}

      {ownerListings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.member.ownerSpaces}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {ownerListings.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
