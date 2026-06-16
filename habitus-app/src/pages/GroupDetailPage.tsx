import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IdentityBadge } from "../components/IdentityBadge";
import { ShareGroupButton } from "../components/ShareGroupButton";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import {
  acceptGroupMember,
  computeFairSplit,
  es,
  fetchGroupBySlug,
  fetchGroupMembers,
  fetchPendingGroupRequests,
  formatPrice,
  isGroupFormed,
  rejectGroupMember,
  requestJoinGroup,
  setGroupStatus,
  type LivingGroup,
  type LivingGroupMember,
} from "@habitus/core";
import { GroupExpensesPanel } from "../components/GroupExpensesPanel";
import { GroupIncidentsPanel } from "../components/GroupIncidentsPanel";
import { Icon } from "../components/Icon";

export function GroupDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<LivingGroup | null>(null);
  const [members, setMembers] = useState<LivingGroupMember[]>([]);
  const [pending, setPending] = useState<LivingGroupMember[]>([]);
  const [totalRent, setTotalRent] = useState(1780);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    const g = await fetchGroupBySlug(slug);
    if (!g) {
      setError(es.groups.empty);
      setGroup(null);
      return;
    }
    setGroup(g);
    const [all, pend] = await Promise.all([
      fetchGroupMembers(g.id),
      fetchPendingGroupRequests(g.id),
    ]);
    setMembers(all.filter((m) => m.isConfirmed));
    setPending(pend);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug, load]);

  const confirmedMembers = members;
  const split = computeFairSplit(
    totalRent,
    confirmedMembers.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      roomLabel: m.roomLabel ?? undefined,
      weight: confirmedMembers.length - i,
    })),
  );

  const myMembership = members.concat(pending).find((m) => m.profileId === user?.id);
  const isLead = myMembership?.groupRole === "lead" || group?.creatorId === user?.id;
  const isConfirmedMember = myMembership?.isConfirmed === true;
  const hasPendingRequest = pending.some((m) => m.profileId === user?.id);
  const canRequestJoin =
    !!user &&
    !!group &&
    group.status === "forming" &&
    !isConfirmedMember &&
    !hasPendingRequest &&
    group.memberCount < group.targetMembers;

  async function handleRequestJoin() {
    if (!group) return;
    setBusy("join");
    setError(null);
    const err = await requestJoinGroup(group.id);
    if (err) setError(err);
    else await load();
    setBusy(null);
  }

  async function handleAccept(profileId: string) {
    if (!group) return;
    setBusy(profileId);
    setError(null);
    const err = await acceptGroupMember(group.id, profileId);
    if (err) setError(err);
    else {
      const refreshed = await fetchGroupBySlug(group.slug);
      if (refreshed) setGroup(refreshed);
      await load();
    }
    setBusy(null);
  }

  async function handleReject(profileId: string) {
    if (!group) return;
    setBusy(`reject-${profileId}`);
    setError(null);
    const err = await rejectGroupMember(group.id, profileId);
    if (err) setError(err);
    else await load();
    setBusy(null);
  }

  async function markReadyFallback() {
    if (!group) return;
    setBusy("ready");
    const err = await setGroupStatus(group.id, "ready");
    if (err) setError(err);
    else setGroup({ ...group, status: "ready" });
    setBusy(null);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (error && !group) {
    return (
      <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <ErrorState message={error ?? es.common.errorLoad} />
        <Link to="/grupos" className="mt-4 inline-flex text-teal-accent hover:underline">
          {es.common.back}
        </Link>
      </main>
    );
  }

  if (!group) return null;

  const formed = isGroupFormed(group);

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
          <div className="flex items-center gap-2">
            {(isLead || isConfirmedMember) && (
              <ShareGroupButton groupName={group.name} slug={group.slug} variant="icon" />
            )}
            <span className="rounded-full bg-surface-container px-4 py-1 text-label-sm">
              {es.groups.status[group.status]}
            </span>
          </div>
        </div>
        {formed && (
          <p className="mt-4 rounded-lg bg-teal-accent/10 px-4 py-3 text-body-sm text-deep-navy">
            {es.groups.groupFormed}
          </p>
        )}
        {group.notes && <p className="mt-4 text-body-md text-warm-slate">{group.notes}</p>}
        {(isLead || isConfirmedMember) && (
          <div className="mt-6">
            <ShareGroupButton groupName={group.name} slug={group.slug} />
          </div>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}

      {canRequestJoin && (
        <button
          type="button"
          disabled={busy === "join"}
          onClick={handleRequestJoin}
          className="mb-8 w-full rounded-lg bg-deep-navy py-3 text-label-md text-on-primary disabled:opacity-60 md:w-auto md:px-8"
        >
          {busy === "join" ? es.common.pleaseWait : es.groups.requestJoin}
        </button>
      )}

      {hasPendingRequest && !isConfirmedMember && (
        <p className="mb-8 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
          {es.groups.requestPending}
        </p>
      )}

      {isLead && pending.length > 0 && (
        <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.groups.pendingRequests}</h2>
          <ul className="space-y-3">
            {pending.map((m) => (
              <li
                key={m.profileId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-light p-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatarUrl ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=habitus"}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <Link to={`/miembro/${m.slug}`} className="text-label-md font-medium text-deep-navy hover:text-teal-accent">
                    {m.displayName}
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === m.profileId}
                    onClick={() => handleAccept(m.profileId)}
                    className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm text-on-primary disabled:opacity-60"
                  >
                    {es.groups.accept}
                  </button>
                  <button
                    type="button"
                    disabled={busy === `reject-${m.profileId}`}
                    onClick={() => handleReject(m.profileId)}
                    className="rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy disabled:opacity-60"
                  >
                    {es.groups.deny}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="mb-4 text-headline-md text-deep-navy">{es.groups.members}</h2>
        <ul className="space-y-4">
          {confirmedMembers.map((m) => (
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
        <p className="mt-4 text-body-sm text-warm-slate">
          {group.memberCount}/{group.targetMembers} {es.groups.members}
        </p>
      </section>

      {isConfirmedMember && (
        <GroupExpensesPanel groupId={group.id} userId={user!.id} members={confirmedMembers} />
      )}

      {isConfirmedMember && (
        <GroupIncidentsPanel groupId={group.id} userId={user!.id} />
      )}

      {isConfirmedMember && (
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
      )}

      {isLead && group.status === "forming" && !formed && (
        <button
          type="button"
          disabled={busy === "ready"}
          onClick={markReadyFallback}
          className="rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy disabled:opacity-60"
        >
          {busy === "ready" ? es.common.pleaseWait : es.groups.markReady}
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
