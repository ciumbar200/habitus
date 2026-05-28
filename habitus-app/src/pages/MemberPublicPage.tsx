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
  fetchPublicGroupsForProfile,
  fetchListingsByHost,
  fetchListingsByOwner,
  fetchPublicMember,
  lifestyleTagLabel,
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
          tasks.push(fetchPublicGroupsForProfile(m.uuid).then(setGroups));
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

  // Combine all listings (host + owner) into a single unified list
  const allListings = [...hostListings, ...ownerListings];
  const hasMultipleListingTypes = hostListings.length > 0 && ownerListings.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      {/* Hero Section - Modern Design with Better Hierarchy */}
      <div className="relative overflow-hidden rounded-2xl card-shadow">
        {/* Large hero image with gradient overlay */}
        <div className="relative h-96 md:h-[28rem]">
          <img
            src={member.image}
            alt={member.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 via-deep-navy/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
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
            {member.isDemo && (
              <span className="rounded-full bg-surface/90 px-3 py-1 text-label-sm text-warm-slate backdrop-blur-md">
                {es.matches.demoProfile}
              </span>
            )}
          </div>
        </div>

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-headline-xl font-semibold text-white">{member.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-label-md text-teal-accent">{member.roleTitle}</p>
              {member.accountRole && (
                <>
                  <span className="text-white/40">·</span>
                  <p className="text-label-sm text-white/80">{accountRoleLabel(member.accountRole)}</p>
                </>
              )}
              {member.identityStatus === "verified" && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="inline-flex items-center gap-1 text-label-sm text-teal-accent">
                    <Icon name="verified_user" className="text-[16px]" />
                    {showTrust ? es.member.trustHint : es.member.verifiedHint}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="mt-8 rounded-2xl border border-border-light bg-surface-container-lowest p-6 md:p-8 card-shadow">
        {/* Bio Section */}
        {member.bio && (
          <section className="mb-8">
            <blockquote className="border-l-4 border-teal-accent pl-4 text-body-lg italic text-warm-slate">
              &ldquo;{member.bio}&rdquo;
            </blockquote>
          </section>
        )}

        {/* Lifestyle Tags */}
        {showLifestyle && member.tags.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-label-md uppercase tracking-wider text-teal-accent">
              {es.member.lifestyle}
            </h2>
            <div className="flex flex-wrap gap-2">
              {member.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-container px-4 py-2 text-label-sm text-deep-navy"
                >
                  {lifestyleTagLabel(tag)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Hint message */}
        {hint && (
          <div className="mb-6 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
            {hint}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={chatLoading}
            onClick={handleChat}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-deep-navy py-3 text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            <Icon name="chat_bubble" className="text-[20px]" />
            {chatLoading ? es.common.pleaseWait : es.matches.startChat}
          </button>
          <Link
            to="/matches"
            className="flex h-12 items-center justify-center rounded-lg border border-border-light px-6 text-label-md text-deep-navy transition-colors hover:bg-surface-container active:scale-95"
          >
            {es.common.back}
          </Link>
        </div>
      </div>

      {/* Unified Properties Section */}
      {allListings.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-headline-md text-deep-navy">{es.member.allSpaces}</h2>
            {hasMultipleListingTypes && (
              <div className="flex gap-2 text-label-sm text-warm-slate">
                <span className="flex items-center gap-1">
                  <Icon name="bed" className="text-teal-accent" />
                  {hostListings.length} {es.member.hostSpaces}
                </span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-1">
                  <Icon name="home" className="text-teal-accent" />
                  {ownerListings.length} {es.member.ownerSpaces}
                </span>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allListings.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Groups Section */}
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
    </main>
  );
}
