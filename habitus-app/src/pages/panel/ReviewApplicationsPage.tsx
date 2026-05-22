import { useEffect, useState } from "react";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import {
  applicationStatusClass,
  applicationStatusLabel,
  formatAppliedDate,
} from "@habitus/core";
import { es } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import {
  fetchApplicationsToReview,
  updateApplicationStatus,
  type ReviewApplication,
} from "@habitus/core";

const ACTIONS: { status: string; progress: number; label: string }[] = [
  { status: "interview_scheduled", progress: 50, label: es.panel.interview },
  { status: "final_review", progress: 75, label: es.panel.review },
  { status: "approved", progress: 100, label: es.panel.approve },
  { status: "rejected", progress: 0, label: es.panel.reject },
];

export function ReviewApplicationsPage() {
  const { user, profile } = useAuth();
  const copy = listingCopyForRole(profile?.accountRole);
  const [apps, setApps] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="mb-stack-lg text-headline-lg text-deep-navy">{es.panel.applications}</h1>

      {loading && <LoadingState message={es.common.loadingApplications} />}
      {error && <ErrorState message={error} />}

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
          </article>
        ))}
      </div>
    </main>
  );
}
