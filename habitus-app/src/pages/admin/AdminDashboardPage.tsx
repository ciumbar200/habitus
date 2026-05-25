import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import { fetchAdminStats, fetchMoonAccessReadiness, type AdminStats } from "@habitus/core";
import { Icon } from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/PageState";

const STAT_LINKS: { key: keyof AdminStats; path: string; icon: string }[] = [
  { key: "users", path: "/admin/usuarios", icon: "group" },
  { key: "listingsPublished", path: "/admin/espacios", icon: "apartment" },
  { key: "listingsDraft", path: "/admin/espacios", icon: "edit_note" },
  { key: "openReports", path: "/admin/reportes", icon: "flag" },
  { key: "blogPosts", path: "/comunidad", icon: "article" },
  { key: "upcomingEvents", path: "/comunidad", icon: "event" },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [moonAccess, setMoonAccess] = useState<{
    userCount: number;
    threshold: number;
    readyToEnable: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchMoonAccessReadiness()])
      .then(([s, m]) => {
        setStats(s);
        setMoonAccess({
          userCount: m.userCount,
          threshold: m.threshold,
          readyToEnable: m.readyToEnable,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.dashboardTitle}</h1>
      <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">{es.admin.dashboardSubtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_LINKS.map(({ key, path, icon }) => (
          <Link
            key={key}
            to={path}
            className="rounded-xl border border-border-light bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <Icon name={icon} className="text-[24px] text-teal-accent" />
              <span className="text-headline-lg text-deep-navy">{stats[key]}</span>
            </div>
            <p className="text-label-md text-warm-slate">{es.admin.stats[key]}</p>
          </Link>
        ))}
      </div>

      {moonAccess && (
        <section className="mt-8 rounded-xl border border-border-light bg-surface-container-lowest p-6">
          <h2 className="text-headline-md text-deep-navy">{es.admin.moonAccess.title}</h2>
          <p className="mt-2 text-body-sm text-warm-slate">{es.admin.moonAccess.note}</p>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-label-sm text-warm-slate">{es.admin.moonAccess.userCount}</p>
              <p className="text-headline-lg text-deep-navy">
                {moonAccess.userCount} / {moonAccess.threshold}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-warm-slate">{es.admin.stats.moonAccessProgress}</p>
              <p className="text-headline-md text-teal-accent">
                {moonAccess.readyToEnable
                  ? es.admin.moonAccess.ready
                  : es.admin.moonAccess.notReady}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-teal-accent transition-all"
              style={{
                width: `${Math.min(100, (moonAccess.userCount / moonAccess.threshold) * 100)}%`,
              }}
            />
          </div>
        </section>
      )}

      <p className="mt-8 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
        {es.admin.betaNote}
      </p>
    </div>
  );
}
