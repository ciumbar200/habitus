import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import {
  fetchAdminMarketplaceDashboard,
  fetchAdminStats,
  fetchMoonAccessReadiness,
  type AdminMarketplaceDashboard,
  type AdminStats,
} from "@habitus/core";
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
  const [marketplace, setMarketplace] = useState<AdminMarketplaceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchMoonAccessReadiness(), fetchAdminMarketplaceDashboard()])
      .then(([s, m, dashboard]) => {
        setStats(s);
        setMarketplace(dashboard);
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

      {marketplace && (
        <>
          <MarketplaceOps dashboard={marketplace} />
          <AssistedMatching dashboard={marketplace} />
          <BusinessFunnel dashboard={marketplace} />
        </>
      )}

      <p className="mt-8 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
        {es.admin.betaNote}
      </p>
    </div>
  );
}

function MarketplaceOps({ dashboard }: { dashboard: AdminMarketplaceDashboard }) {
  const roleMetrics = dashboard.roles;
  const roles = [
    {
      title: "Inquilinos",
      value: roleMetrics.tenants.registered,
      items: [
        `${roleMetrics.tenants.incompleteProfiles} perfiles incompletos`,
        `${roleMetrics.tenants.citiesTracked} ciudades con demanda`,
        `${roleMetrics.tenants.withBudget} con presupuesto informado`,
        `${roleMetrics.tenants.withMoveIn} con fecha de entrada`,
        `${roleMetrics.tenants.usersWithoutMatch} usuarios sin match aprobado`,
      ],
    },
    {
      title: "Propietarios",
      value: roleMetrics.owners.total,
      items: [
        `${roleMetrics.owners.listingsPublished} pisos completos publicados`,
        `${roleMetrics.owners.listingsPending} pisos pendientes`,
        `${roleMetrics.owners.groupsInterested} grupos interesados`,
        `${roleMetrics.owners.groupsAccepted} grupos aceptados`,
        `${roleMetrics.owners.lowConversionListings} pisos con baja conversión`,
      ],
    },
    {
      title: "Anfitriones",
      value: roleMetrics.hosts.total,
      items: [
        `${roleMetrics.hosts.roomsPublished} habitaciones publicadas`,
        `${roleMetrics.hosts.candidatesReceived} candidatos recibidos`,
        `${roleMetrics.hosts.pendingApplications} solicitudes pendientes`,
        `${roleMetrics.hosts.occupiedRooms} habitaciones ocupadas/aprobadas`,
        `${roleMetrics.hosts.incompleteListings} publicaciones incompletas`,
      ],
    },
    {
      title: "Operadores",
      value: roleMetrics.operators.total,
      items: [
        `${roleMetrics.operators.inventoryPublished} unidades en inventario`,
        `${roleMetrics.operators.activeUnits} unidades activas`,
        `${roleMetrics.operators.applicationsReceived} solicitudes recibidas`,
        `Conversión: ${roleMetrics.operators.conversionRate == null ? "Pendiente" : `${roleMetrics.operators.conversionRate}%`}`,
        `${roleMetrics.operators.responsePending} respuestas pendientes`,
        `${roleMetrics.operators.potentialCommissions.toLocaleString("es-ES")} € comisiones potenciales`,
      ],
    },
  ];

  return (
    <section className="mt-8">
      <h2 className="text-headline-md text-deep-navy">Operación marketplace por rol</h2>
      <p className="mt-2 max-w-3xl text-body-md text-warm-slate">
        Visibilidad no destructiva sobre los cuatro lados del marketplace: inquilinos, propietarios,
        anfitriones y operadores.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => (
          <div key={role.title} className="rounded-xl border border-border-light bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-headline-sm text-deep-navy">{role.title}</h3>
              <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-teal-accent">
                {role.value}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {role.items.map((item) => (
                <li key={item} className="flex gap-2 text-body-sm text-warm-slate">
                  <Icon name="check_circle" className="mt-0.5 text-[16px] text-teal-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function AssistedMatching({ dashboard }: { dashboard: AdminMarketplaceDashboard }) {
  return (
    <section className="mt-8 rounded-xl border border-border-light bg-surface-container-lowest p-6">
      <h2 className="text-headline-md text-deep-navy">Matching asistido</h2>
      <p className="mt-2 text-body-md text-warm-slate">
        Interfaz preparada para operar recomendaciones manuales usando criterios básicos disponibles:
        ciudad, presupuesto, fecha de entrada, duración, tipo de búsqueda y perfil de convivencia.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {dashboard.assistedMatching.map((row) => (
          <div key={`${row.from}-${row.to}`} className="flex items-center justify-between gap-4 rounded-lg bg-surface-container px-4 py-3">
            <div>
              <span className="text-label-md text-deep-navy">{row.from} → {row.to}</span>
              <p className="text-label-sm text-warm-slate">{row.criteria}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-label-sm text-warm-slate">{row.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BusinessFunnel({ dashboard }: { dashboard: AdminMarketplaceDashboard }) {
  const { funnel } = dashboard;
  const money = (value: number) => `${value.toLocaleString("es-ES")} ${funnel.currency}`;
  const metrics = [
    ["Solicitudes creadas", funnel.applicationsCreated],
    ["Matches enviados", funnel.matchesSent],
    ["Matches aceptados", funnel.matchesAccepted],
    ["Reservas pendientes", funnel.reservationsPending],
    ["Entradas confirmadas", funnel.confirmedEntries],
    ["Matches perdidos", funnel.matchesLost],
    ["Valor potencial de contratos", money(funnel.potentialContractValue)],
    ["Comisión estimada", money(funnel.estimatedCommission)],
    ["Comisión confirmada", money(funnel.confirmedCommission)],
    ["Comisión pendiente", money(funnel.pendingCommission)],
  ];

  return (
    <section className="mt-8 rounded-xl border border-border-light bg-surface-container-lowest p-6">
      <h2 className="text-headline-md text-deep-navy">Funnel y monetización</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-container p-4">
            <p className="text-label-sm text-warm-slate">{label}</p>
            <p className="mt-1 text-headline-sm text-deep-navy">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          "Propietario: comisión por grupo que alquila piso",
          "Anfitrión: comisión por inquilino aceptado o entrada confirmada",
          "Operador: comisión por reserva, plan mensual o modelo híbrido",
        ].map((model) => (
          <p key={model} className="rounded-lg border border-border-light px-4 py-3 text-body-sm text-warm-slate">
            {model}
          </p>
        ))}
      </div>
    </section>
  );
}
