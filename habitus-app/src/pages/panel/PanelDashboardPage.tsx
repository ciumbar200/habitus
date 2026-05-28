import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/PageState";
import { PublishListingModal } from "../../components/panel/PublishListingModal";
import { useAuth } from "../../context/AuthContext";
import { es } from "@habitus/core";
import { fetchPanelStats } from "@habitus/core";
import { fetchOperatorDashboard } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import type { OperatorDashboardData } from "@habitus/core";
import { useI18n } from "../../lib/I18nContext";

export function PanelDashboardPage() {
  const { profile, profileReady } = useAuth();
  const t = useI18n();
  const role = profile?.accountRole;
  const [stats, setStats] = useState({ listings: 0, applications: 0, published: 0 });
  const [operatorData, setOperatorData] = useState<OperatorDashboardData | null>(null);
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
    Promise.all([
      fetchPanelStats(profile.id, role),
      role === "agencia" ? fetchOperatorDashboard(profile.id) : Promise.resolve(null),
    ])
      .then(([panelStats, operatorDashboard]) => {
        setStats(panelStats);
        setOperatorData(operatorDashboard);
      })
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
  const roleHint = {
    inquilino: t.panel.inquilinoHint,
    anfitrion: t.panel.anfitrionHint,
    propietario: t.panel.propietarioHint,
    agencia: t.panel.agenciaHint,
  }[role];

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <span className="text-label-md uppercase tracking-wider text-teal-accent">{t.panel.title}</span>
        <h1 className="text-headline-lg text-deep-navy">
          {t.panel.welcome}, {firstName}
        </h1>
        <p className="mt-1 text-label-md text-teal-accent">{t.accountRoles[role]}</p>
        <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">{roleHint}</p>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="mb-stack-lg grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon="apartment" label={copy.statsListings} value={stats.listings} />
            <StatCard icon="visibility" label={t.panel.statsPublished} value={stats.published} />
            <StatCard
              icon="assignment"
              label={t.panel.statsApplications}
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
              {t.panel.applications}
            </Link>
            {(role === "propietario" || role === "agencia") && (
              <Link
                to="/panel/inquilinos"
                className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
              >
                <Icon name="groups" />
                {role === "agencia" ? "Candidatos y grupos" : t.panel.ownerTenantsTitle}
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
          {role === "agencia" && operatorData && <OperatorDashboardSection data={operatorData} />}
        </>
      )}

      {canPublish && (
        <PublishListingModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            if (profile?.id && role) {
              fetchPanelStats(profile.id, role).then(setStats).catch(() => {});
              if (role === "agencia") {
                fetchOperatorDashboard(profile.id).then(setOperatorData).catch(() => {});
              }
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
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <Icon name={icon} className="mb-2 text-teal-accent" />
      <p className="text-headline-md text-deep-navy">{value}</p>
      <p className="text-label-sm text-warm-slate">{label}</p>
    </div>
  );
}

function OperatorDashboardSection({
  data,
}: {
  data: OperatorDashboardData;
}) {
  const pipeline = Object.entries(data.pipeline).map(([label, value]) => ({ label, value }));
  const money = `${data.metrics.potentialRevenue.toLocaleString("es-ES")} ${data.metrics.currency}`;

  return (
    <section className="mt-stack-lg space-y-6">
      <div>
        <p className="text-label-md uppercase tracking-wider text-teal-accent">Panel de operador</p>
        <h2 className="text-headline-md text-deep-navy">
          Inventario, candidatos y ocupación
        </h2>
        <p className="mt-2 max-w-3xl text-body-md text-warm-slate">
          El rol interno legacy sigue siendo <code>agencia</code> para no romper permisos existentes,
          pero la experiencia visible queda preparada para operadores de coliving y gestores profesionales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon="home_work" label="Habitaciones/unidades publicadas" value={data.metrics.listings} />
        <StatCard icon="event_available" label="Habitaciones disponibles" value={data.metrics.available} />
        <StatCard icon="assignment" label="Solicitudes nuevas" value={data.metrics.newApplications} />
        <StatCard icon="pending_actions" label="Matches pendientes" value={data.metrics.pendingMatches} />
        <StatCard icon="person_check" label="Candidatos aceptados" value={data.metrics.acceptedCandidates} />
        <StatCard icon="check_circle" label="Reservas o entradas confirmadas" value={data.metrics.confirmedEntries} />
        <StatCard icon="schedule" label="Tiempo medio hasta match" value={data.metrics.averageDaysToMatch ?? "Próximamente"} />
        <StatCard icon="monitoring" label="Ocupación estimada" value={data.metrics.estimatedOccupancy == null ? "Próximamente" : `${data.metrics.estimatedOccupancy}%`} />
        <StatCard icon="payments" label="Ingresos potenciales mensuales" value={money} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
          <h3 className="text-headline-sm text-deep-navy">Pipeline de candidatos</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {pipeline.map((stage) => (
              <div key={stage.label} className="rounded-lg border border-border-light bg-surface-container p-4">
                <p className="text-label-sm text-warm-slate">{stage.label}</p>
                <p className="mt-1 text-headline-sm text-deep-navy">{stage.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
          <h3 className="text-headline-sm text-deep-navy">Centro de notificaciones</h3>
          <ul className="mt-4 space-y-3">
            {data.notifications.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
                <span>{item.label}</span>
                <span className="rounded-full bg-white px-2 py-1 text-label-sm text-teal-accent">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-headline-sm text-deep-navy">Candidatos por habitación/unidad</h3>
            <p className="mt-1 text-body-sm text-warm-slate">
              Preparado para mostrar nombre, avatar, presupuesto, fecha de entrada, duración, zona,
              estado, match score y acciones de ver perfil, aceptar, rechazar o contactar.
            </p>
          </div>
          <Link
            to="/panel/solicitudes"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
          >
            <Icon name="assignment" />
            Ver solicitudes
          </Link>
        </div>
        {data.candidates.length === 0 ? (
          <p className="mt-6 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
            Sin candidatos activos todavía. Cuando existan solicitudes en Supabase, aparecerán agrupadas por unidad.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-body-sm">
              <thead className="text-label-sm text-warm-slate">
                <tr>
                  <th className="px-3 py-2">Candidato</th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2">Presupuesto</th>
                  <th className="px-3 py-2">Entrada</th>
                  <th className="px-3 py-2">Zona</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Match</th>
                </tr>
              </thead>
              <tbody>
                {data.candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-border-light">
                    <td className="px-3 py-3 text-deep-navy">{candidate.name}</td>
                    <td className="px-3 py-3 text-warm-slate">{candidate.listingName}</td>
                    <td className="px-3 py-3 text-warm-slate">{candidate.budget}</td>
                    <td className="px-3 py-3 text-warm-slate">{candidate.moveIn}</td>
                    <td className="px-3 py-3 text-warm-slate">{candidate.cityZone}</td>
                    <td className="px-3 py-3 text-warm-slate">{candidate.status}</td>
                    <td className="px-3 py-3 text-teal-accent">
                      {candidate.matchScore == null ? "Pendiente" : `${candidate.matchScore}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h3 className="text-headline-sm text-deep-navy">Métricas por habitación/unidad</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.units.map((unit) => (
            <div key={unit.id} className="rounded-lg bg-surface-container p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label-md text-deep-navy">{unit.name}</p>
                  <p className="text-label-sm text-warm-slate">{unit.status}</p>
                </div>
                <span className="text-label-sm text-teal-accent">
                  {unit.priceMonthly.toLocaleString("es-ES")} {unit.currency}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-label-sm text-warm-slate">
                <span>Solicitudes: {unit.applications}</span>
                <span>Activos: {unit.activeCandidates}</span>
                <span>Conversión: {unit.conversionRate == null ? "Pendiente" : `${unit.conversionRate}%`}</span>
                <span>Días publicada: {unit.daysPublished ?? "Pendiente"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
