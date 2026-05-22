import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IdentityBadge } from "../components/IdentityBadge";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import {
  computeFairSplit,
  es,
  fetchGroupBySlug,
  fetchGroupMembers,
  formatPrice,
  setGroupStatus,
  type LivingGroup,
  type LivingGroupMember,
} from "@habitus/core";
import { Icon } from "../components/Icon";

export function GroupDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<LivingGroup | null>(null);
  const [members, setMembers] = useState<LivingGroupMember[]>([]);
  const [totalRent, setTotalRent] = useState(1780);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchGroupBySlug(slug)
      .then(async (g) => {
        if (!g) {
          setError(es.groups.empty);
          return;
        }
        setGroup(g);
        const m = await fetchGroupMembers(g.id);
        setMembers(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug]);

  const split = computeFairSplit(
    totalRent,
    members.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      roomLabel: m.roomLabel ?? undefined,
      weight: members.length - i,
    })),
  );

  async function markReady() {
    if (!group) return;
    setBusy(true);
    const err = await setGroupStatus(group.id, "ready");
    if (err) setError(err);
    else setGroup({ ...group, status: "ready" });
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <ErrorState message={error ?? es.common.errorLoad} />
        <Link to="/grupos" className="mt-4 inline-flex text-teal-accent hover:underline">
          {es.common.back}
        </Link>
      </main>
    );
  }

  const isLead = members.some((m) => m.profileId === user?.id && m.groupRole === "lead");

  return (
    <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <Link to="/grupos" className="mb-6 inline-flex items-center gap-1 text-label-md text-teal-accent hover:underline">
        <Icon name="arrow_back" className="text-[18px]" />
        {es.groups.myGroups}
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-headline-lg text-deep-navy">{group.name}</h1>
            {group.city && <p className="mt-1 text-body-md text-warm-slate">{group.city}</p>}
          </div>
          <span className="rounded-full bg-surface-container px-4 py-1 text-label-sm">
            {es.groups.status[group.status]}
          </span>
        </div>
        {group.notes && <p className="mt-4 text-body-md text-warm-slate">{group.notes}</p>}
      </header>

      <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="mb-4 text-headline-md text-deep-navy">{es.groups.members}</h2>
        <ul className="space-y-4">
          {members.map((m) => (
            <li
              key={m.profileId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-light p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={m.avatarUrl ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=habitus"}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <Link
                    to={`/miembro/${m.slug}`}
                    className="text-label-md font-medium text-deep-navy hover:text-teal-accent"
                  >
                    {m.displayName}
                  </Link>
                  <p className="text-label-sm text-warm-slate">
                    {m.groupRole === "lead" ? es.groups.lead : es.groups.member}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IdentityBadge status={m.identityStatus} size="sm" />
                <Link
                  to={`/miembro/${m.slug}`}
                  aria-label={es.matches.viewProfile}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light hover:bg-surface-container"
                >
                  <Icon name="visibility" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="text-headline-md text-deep-navy">{es.groups.fairSplit}</h2>
        <p className="mt-2 text-body-sm text-warm-slate">{es.groups.fairSplitHint}</p>
        <label className="mt-4 block text-label-md text-deep-navy">
          {es.groups.totalRent}
          <input
            type="number"
            min={0}
            value={totalRent}
            onChange={(e) => setTotalRent(Number(e.target.value))}
            className="field-input mt-1"
          />
        </label>
        <ul className="mt-4 space-y-2">
          {split.map((line) => (
            <li
              key={line.profileId}
              className="flex justify-between rounded-lg bg-surface-container px-4 py-3 text-body-sm"
            >
              <span>
                {line.displayName} · {line.roomLabel}
              </span>
              <span className="font-semibold text-teal-accent">{formatPrice(line.amount, "EUR")}</span>
            </li>
          ))}
        </ul>
      </section>

      {isLead && group.status === "forming" && (
        <button
          type="button"
          disabled={busy}
          onClick={markReady}
          className="rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary disabled:opacity-60"
        >
          {busy ? es.common.pleaseWait : es.groups.markReady}
        </button>
      )}

      <Link
        to="/descubrir"
        className="ml-4 inline-flex rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
      >
        {es.common.exploreSpaces}
      </Link>
    </main>
  );
}
