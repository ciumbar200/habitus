import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/PageState";
import { PublishListingModal } from "../../components/panel/PublishListingModal";
import { useAuth } from "../../context/AuthContext";
import { es } from "@habitus/core";
import { accountRoleLabel } from "@habitus/core";
import { fetchPanelStats } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";

const hints: Record<AccountRoleSlug, string> = {
  inquilino: es.panel.inquilinoHint,
  anfitrion: es.panel.anfitrionHint,
  propietario: es.panel.propietarioHint,
  agencia: es.panel.agenciaHint,
};

export function PanelDashboardPage() {
  const { profile, profileReady } = useAuth();
  const role = profile?.accountRole;
  const [stats, setStats] = useState({ listings: 0, applications: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const canPublish = role === "anfitrion" || role === "propietario" || role === "agencia";
  const copy = listingCopyForRole(role);

  useEffect(() => {
    if (!profileReady) return;

    if (!profile?.id || !role || role === "inquilino") {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchPanelStats(profile.id, role)
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [profileReady, profile?.id, role]);

  if (!profileReady) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (!role || role === "inquilino") {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <p className="text-body-md text-warm-slate">{es.panel.inquilinoHint}</p>
        <Link to="/descubrir" className="mt-4 inline-flex text-teal-accent hover:underline">
          {es.common.exploreSpaces}
        </Link>
      </main>
    );
  }

  const firstName = profile?.displayName?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <span className="text-label-md uppercase tracking-wider text-teal-accent">
          {es.panel.title}
        </span>
        <h1 className="text-headline-lg text-deep-navy">
          {es.panel.welcome}, {firstName}
        </h1>
        <p className="mt-1 text-label-md text-teal-accent">{accountRoleLabel(role)}</p>
        <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">{hints[role]}</p>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="mb-stack-lg grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon="apartment" label={copy.statsListings} value={stats.listings} />
            <StatCard icon="visibility" label={es.panel.statsPublished} value={stats.published} />
            <StatCard
              icon="assignment"
              label={es.panel.statsApplications}
              value={stats.applications}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {canPublish && (
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white"
              >
                <Icon name="add" />
                {copy.newListing}
              </button>
            )}
            <Link
              to="/panel/solicitudes"
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
            >
              <Icon name="assignment" />
              {es.panel.applications}
            </Link>
            {(role === "propietario" || role === "agencia") && (
              <Link
                to="/panel/inquilinos"
                className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
              >
                <Icon name="groups" />
                {es.panel.ownerTenantsTitle}
              </Link>
            )}
            <Link
              to="/panel/espacios"
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
            >
              <Icon name="home_work" />
              {copy.myListings}
            </Link>
            {role === "anfitrion" && (
              <>
                <Link
                  to="/panel/espacios/nuevo"
                  className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
                >
                  <Icon name="add" />
                  {copy.publishModalTitle}
                </Link>
                <Link
                  to="/panel/convivencia"
                  className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
                >
                  <Icon name="group" />
                  {copy.convivenciaTitle}
                </Link>
              </>
            )}
          </div>
        </>
      )}

      {canPublish && (
        <PublishListingModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            if (profile?.id && role) {
              fetchPanelStats(profile.id, role).then(setStats).catch(() => {});
            }
          }}
        />
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <Icon name={icon} className="mb-2 text-teal-accent" />
      <p className="text-headline-md text-deep-navy">{value}</p>
      <p className="text-label-sm text-warm-slate">{label}</p>
    </div>
  );
}
