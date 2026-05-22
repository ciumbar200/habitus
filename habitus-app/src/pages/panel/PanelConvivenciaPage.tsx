import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  applicationStatusClass,
  applicationStatusLabel,
  es,
  fetchApplicationsToReview,
  fetchCompatQuiz,
  fetchInquilinoMatchesForHost,
  formatAppliedDate,
} from "@habitus/core";
import type { ReviewApplication, Roommate } from "@habitus/core";
import { RoommateCard } from "../../components/RoommateCard";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import { isSupabaseConfigured } from "../../lib/supabase";

export function PanelConvivenciaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apps, setApps] = useState<ReviewApplication[]>([]);
  const [matches, setMatches] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          fetchInquilinoMatchesForHost(user.id, quiz),
          fetchApplicationsToReview(user.id),
        ]),
      )
      .then(([tenantMatches, applications]) => {
        setMatches(tenantMatches);
        setApps(applications);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <h1 className="text-headline-lg text-deep-navy">{es.compat.hostMatchesTitle}</h1>
        <p className="mt-2 max-w-2xl text-body-md text-warm-slate">{es.compat.hostMatchesSubtitle}</p>
      </section>

      {loading && <LoadingState message={es.common.loading} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && matches.length === 0 && (
        <div className="mb-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-8 text-center card-shadow">
          <p className="text-body-md text-warm-slate">{es.compat.noHostMatches}</p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <section className="mb-stack-lg">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((r) => (
              <RoommateCard
                key={r.uuid ?? r.slug}
                roommate={r}
                onConversationStarted={(id) => navigate(`/messages?c=${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border-light pt-stack-lg">
        <h2 className="text-headline-md text-deep-navy">{es.panel.applications}</h2>
        <p className="mt-1 text-body-md text-warm-slate">{es.panel.convivenciaSubtitle}</p>

        {!loading && !error && apps.length === 0 && (
          <p className="mt-6 text-body-md text-warm-slate">{es.panel.noApplications}</p>
        )}

        <ul className="mt-6 space-y-3">
          {apps.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-light bg-surface-container-lowest p-4"
            >
              <div>
                <p className="text-label-md text-deep-navy">{app.applicantName}</p>
                <p className="text-label-sm text-warm-slate">{app.listingName}</p>
                {app.appliedAt && (
                  <p className="text-label-sm text-outline">{formatAppliedDate(app.appliedAt)}</p>
                )}
              </div>
              <span
                className={`rounded px-2 py-1 text-label-sm ${applicationStatusClass(app.status)}`}
              >
                {applicationStatusLabel(app.status)}
              </span>
              <Link
                to="/panel/solicitudes"
                className="text-label-md text-teal-accent hover:underline"
              >
                {es.common.view}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
