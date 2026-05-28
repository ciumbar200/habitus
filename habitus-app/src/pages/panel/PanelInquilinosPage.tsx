import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  es,
  fetchCompatQuiz,
  fetchFormedGroupsForManager,
  fetchInquilinoMatchesForManager,
  fetchManagerGroupMembers,
  fetchApplicationsToReview,
  formatAppliedDate,
  formatMoonLocation,
  imageUrlOrPlaceholder,
  startConversationWith,
  type ManagerFormedGroup,
  type ManagerGroupMember,
  type ReviewApplication,
  type Roommate,
} from "@habitus/core";
import { SimpleTenantCard } from "../../components/SimpleTenantCard";
import { LoadingState, ErrorState } from "../../components/PageState";
import { Icon } from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { isSupabaseConfigured } from "../../lib/supabase";

export function PanelInquilinosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Roommate[]>([]);
  const [groups, setGroups] = useState<ManagerFormedGroup[]>([]);
  const [apps, setApps] = useState<ReviewApplication[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, ManagerGroupMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchCompatQuiz(user.id)
      .then((quiz) =>
        Promise.all([
          fetchInquilinoMatchesForManager(user.id, quiz),
          fetchFormedGroupsForManager(),
          fetchApplicationsToReview(user.id),
        ]),
      )
      .then(([tenantMatches, formedGroups, applications]) => {
        setMatches(tenantMatches);
        setGroups(formedGroups);
        setApps(applications.slice(0, 8));
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function toggleGroup(groupId: string) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      return;
    }
    setExpandedGroup(groupId);
    if (groupMembers[groupId]) return;
    try {
      const members = await fetchManagerGroupMembers(groupId);
      setGroupMembers((prev) => ({ ...prev, [groupId]: members }));
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    }
  }

  async function openChat(profileId: string) {
    setChatBusy(profileId);
    try {
      const convId = await startConversationWith(profileId);
      navigate(`/messages?c=${convId}`);
    } catch {
      setError(es.matches.chatError);
    } finally {
      setChatBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <h1 className="text-headline-lg text-deep-navy">{es.panel.ownerTenantsTitle}</h1>
        <p className="mt-2 max-w-3xl text-body-md text-warm-slate">{es.panel.ownerTenantsSubtitle}</p>
        <p className="mt-2 max-w-3xl text-body-sm text-warm-slate">{es.panel.ownerTenantsPublicHint}</p>
      </section>

      {loading && <LoadingState message={es.common.loading} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <section className="mb-stack-lg">
            <h2 className="text-headline-md text-deep-navy">{es.panel.formedGroupsTitle}</h2>
            <p className="mt-1 text-body-md text-warm-slate">{es.panel.formedGroupsSubtitle}</p>

            {groups.length === 0 ? (
              <p className="mt-6 rounded-xl border border-border-light bg-surface-container-lowest p-6 text-body-md text-warm-slate">
                {es.panel.noFormedGroups}
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {groups.map((group) => {
                  const open = expandedGroup === group.id;
                  const members = groupMembers[group.id] ?? [];
                  return (
                    <li
                      key={group.id}
                      className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest card-shadow"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-surface-container/40"
                      >
                        <div>
                          <p className="text-label-md text-deep-navy">{group.name}</p>
                          <p className="text-label-sm text-warm-slate">
                            {formatMoonLocation(group.city, group.zone)} · {group.memberCount}/
                            {group.targetMembers} {es.groups.members}
                          </p>
                          <span className="mt-1 inline-block rounded-full bg-teal-accent/10 px-2 py-0.5 text-label-sm text-teal-accent">
                            {es.groups.formedBadge}
                          </span>
                        </div>
                        <Icon name={open ? "expand_less" : "expand_more"} className="text-warm-slate" />
                      </button>

                      {open && (
                        <div className="border-t border-border-light px-4 pb-4 pt-3">
                          {members.length === 0 ? (
                            <p className="text-body-sm text-warm-slate">{es.common.loading}</p>
                          ) : (
                            <ul className="space-y-2">
                              {members.map((member) => (
                                <li
                                  key={member.profileId}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-light/80 p-3"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <img
                                      src={imageUrlOrPlaceholder(member.avatarUrl)}
                                      alt=""
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                    <div>
                                      <p className="text-label-md text-deep-navy">{member.displayName}</p>
                                      <p className="text-label-sm text-warm-slate">
                                        {member.groupRole === "lead" ? es.groups.lead : es.groups.member}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Link
                                      to={`/miembro/${member.slug}`}
                                      className="rounded-lg border border-border-light px-3 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
                                    >
                                      {es.common.view}
                                    </Link>
                                    <button
                                      type="button"
                                      disabled={chatBusy === member.profileId}
                                      onClick={() => openChat(member.profileId)}
                                      className="rounded-lg bg-deep-navy px-3 py-2 text-label-sm text-on-primary disabled:opacity-60"
                                    >
                                      {chatBusy === member.profileId
                                        ? es.common.pleaseWait
                                        : es.matches.startChat}
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mb-stack-lg border-t border-border-light pt-stack-lg">
            <h2 className="text-headline-md text-deep-navy">{es.compat.hostMatchesTitle}</h2>
            <p className="mt-1 text-body-md text-warm-slate">{es.panel.ownerMatchesSubtitle}</p>

            {matches.length === 0 ? (
              <p className="mt-6 text-body-md text-warm-slate">{es.compat.noHostMatches}</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((r) => (
                  <SimpleTenantCard
                    key={r.uuid ?? r.slug}
                    roommate={r}
                    onConversationStarted={(id) => navigate(`/messages?c=${id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-border-light pt-stack-lg">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-headline-md text-deep-navy">{es.panel.applications}</h2>
                <p className="mt-1 text-body-md text-warm-slate">{es.panel.ownerApplicationsSubtitle}</p>
              </div>
              <Link
                to="/panel/solicitudes"
                className="text-label-md text-teal-accent hover:underline"
              >
                {es.common.viewAll}
              </Link>
            </div>

            {apps.length === 0 ? (
              <p className="mt-6 text-body-md text-warm-slate">{es.panel.noApplications}</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {apps.map((app) => (
                  <li
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-light bg-surface-container-lowest p-4"
                  >
                    <div>
                      <p className="text-label-md text-deep-navy">{app.applicantName}</p>
                      <p className="text-label-sm text-warm-slate">
                        {app.listingName}
                        {app.listingVisibility === "public"
                          ? ` · ${es.property.publicBadge}`
                          : ` · ${es.property.privateBadge}`}
                      </p>
                      {app.groupName && (
                        <p className="text-body-sm text-teal-accent">
                          {es.application.applyAsGroup}: {app.groupName}
                        </p>
                      )}
                      {app.appliedAt && (
                        <p className="text-label-sm text-outline">{formatAppliedDate(app.appliedAt)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/miembro/${app.applicantSlug}`}
                        className="rounded-lg border border-border-light px-3 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
                      >
                        {es.common.view}
                      </Link>
                      <button
                        type="button"
                        disabled={chatBusy === app.applicantId}
                        onClick={() => openChat(app.applicantId)}
                        className="rounded-lg bg-deep-navy px-3 py-2 text-label-sm text-on-primary disabled:opacity-60"
                      >
                        {chatBusy === app.applicantId ? es.common.pleaseWait : es.matches.startChat}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
