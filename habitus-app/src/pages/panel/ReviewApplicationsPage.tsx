import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import {
  applicationStatusClass,
  applicationStatusLabel,
  createLeaseDraft,
  es,
  fetchApplicationsToReview,
  fetchConfirmedGroupMembers,
  formatAppliedDate,
  listingCopyForRole,
  startConversationWith,
  updateApplicationStatus,
  updateLeaseStatus,
  type ReviewApplication,
} from "@habitus/core";

const ACTIONS: { status: string; progress: number; label: string }[] = [
  { status: "interview_scheduled", progress: 50, label: es.panel.interview },
  { status: "final_review", progress: 75, label: es.panel.review },
  { status: "approved", progress: 100, label: es.panel.approve },
  { status: "rejected", progress: 0, label: es.panel.reject },
];

export function ReviewApplicationsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const copy = listingCopyForRole(profile?.accountRole);
  const [apps, setApps] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chatBusyId, setChatBusyId] = useState<string | null>(null);
  const [leaseMsg, setLeaseMsg] = useState<string | null>(null);

  const reload = () => {
    if (!user?.id) return;
    setLoading(true);
    fetchApplicationsToReview(user.id)
      .then(setApps)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [user?.id]);

  const handleAction = async (appId: string, status: string, progress: number) => {
    setBusyId(appId);
    const { error: err } = await updateApplicationStatus(appId, status, progress);
    setBusyId(null);
    if (err) {
      setError(err);
      return;
    }
    reload();
  };

  const handleGenerateLease = async (app: ReviewApplication) => {
    if (!user?.id) return;
    setBusyId(app.id);
    setLeaseMsg(null);
    try {
      const members = app.groupId
        ? await fetchConfirmedGroupMembers(app.groupId)
        : [{ profileId: app.applicantId }];
      const tenantIds = members.map((m) => m.profileId);
      const { leaseId, error: createErr } = await createLeaseDraft({
        listingId: app.listingId,
        ownerId: user.id,
        groupId: app.groupId,
        applicationId: app.id,
        tenantProfileIds: tenantIds,
      });
      if (createErr || !leaseId) {
        setError(createErr ?? es.common.errorLoad);
        setBusyId(null);
        return;
      }
      await updateLeaseStatus(leaseId, "pending_signatures");
      setLeaseMsg(es.leases.generateSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    }
    setBusyId(null);
  };

  const handleChat = async (applicantId: string) => {
    setChatBusyId(applicantId);
    try {
      const convId = await startConversationWith(applicantId);
      navigate(`/messages?c=${convId}`);
    } catch {
      setError(es.matches.chatError);
    } finally {
      setChatBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="mb-stack-lg text-headline-lg text-deep-navy">{es.panel.applications}</h1>

      {loading && <LoadingState message={es.common.loadingApplications} />}
      {error && <ErrorState message={error} />}

      {leaseMsg && (
        <p className="mb-4 rounded-lg bg-teal-accent/10 px-4 py-3 text-body-sm text-deep-navy">
          {leaseMsg}
        </p>
      )}

      {!loading && !error && apps.length === 0 && (
        <p className="text-body-md text-warm-slate">{es.panel.noApplications}</p>
      )}

      <div className="space-y-4">
        {apps.map((app) => (
          <article
            key={app.id}
            className="rounded-xl border border-border-light bg-surface-container-lowest p-5 card-shadow"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-label-sm text-warm-slate">{es.panel.applicant}</p>
                <h2 className="text-headline-md text-deep-navy">{app.applicantName}</h2>
                <p className="mt-1 text-body-md text-warm-slate">
                  {copy.listColumn}: <strong>{app.listingName}</strong>
                </p>
                {app.groupName && (
                  <p className="text-body-sm text-teal-accent">
                    {es.application.applyAsGroup}: {app.groupName}
                  </p>
                )}
                <p className="text-label-sm text-warm-slate">
                  {app.listingVisibility === "public"
                    ? es.property.publicBadge
                    : es.property.privateBadge}
                </p>
                {app.appliedAt && (
                  <p className="text-label-sm text-warm-slate">
                    {formatAppliedDate(app.appliedAt)}
                  </p>
                )}
              </div>
              <span
                className={`rounded px-2 py-1 text-label-sm ${applicationStatusClass(app.status)}`}
              >
                {applicationStatusLabel(app.status)}
              </span>
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="h-full bg-teal-accent"
                style={{ width: `${app.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/miembro/${app.applicantSlug}`}
                className="rounded-lg border border-border-light px-3 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
              >
                {es.common.view}
              </Link>
              <button
                type="button"
                disabled={chatBusyId === app.applicantId}
                onClick={() => handleChat(app.applicantId)}
                className="rounded-lg border border-deep-navy px-3 py-2 text-label-sm text-deep-navy hover:bg-surface-container disabled:opacity-60"
              >
                {chatBusyId === app.applicantId ? es.common.pleaseWait : es.matches.startChat}
              </button>
              {ACTIONS.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={busyId === app.id}
                  onClick={() => handleAction(app.id, action.status, action.progress)}
                  className={`rounded-lg px-3 py-2 text-label-sm disabled:opacity-60 ${
                    action.status === "rejected"
                      ? "border border-error text-error"
                      : action.status === "approved"
                        ? "bg-teal-accent text-deep-navy"
                        : "border border-border-light text-deep-navy hover:bg-surface-container"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            {app.status === "approved" && (
              <button
                type="button"
                disabled={busyId === app.id}
                onClick={() => handleGenerateLease(app)}
                className="mt-3 rounded-lg border border-deep-navy px-4 py-2 text-label-sm text-deep-navy hover:bg-surface-container disabled:opacity-60"
              >
                {es.leases.generate}
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
