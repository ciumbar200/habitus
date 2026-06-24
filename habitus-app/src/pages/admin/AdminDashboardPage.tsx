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
import { AdminPageShell, AdminSection, AdminStatCard } from "../../components/admin/AdminPageShell";
import { AdminIntegrationHealthBar } from "../../components/admin/AdminIntegrationHealthBar";
import { adminFetchVerifications } from "../../lib/verification";

const PRIORITY_LINKS = [
  { path: "/admin/verificaciones", icon: "verified_user", label: "Verificaciones", color: "text-teal-accent" },
  { path: "/admin/reportes", icon: "flag", label: "Reportes", color: "text-amber-600" },
  { path: "/admin/solicitudes", icon: "assignment", label: "Solicitudes", color: "text-sky-600" },
  { path: "/admin/integraciones", icon: "tune", label: "Integraciones", color: "text-violet-600" },
  { path: "/admin/usuarios", icon: "group", label: "Usuarios", color: "text-deep-navy" },
  { path: "/admin/espacios", icon: "apartment", label: "Espacios", color: "text-deep-navy" },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [moonAccess, setMoonAccess] = useState<{
    userCount: number;
    threshold: number;
    readyToEnable: boolean;
  } | null>(null);
  const [marketplace, setMarketplace] = useState<AdminMarketplaceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAdminStats(),
      fetchMoonAccessReadiness(),
      fetchAdminMarketplaceDashboard(),
      adminFetchVerifications().catch(() => []),
    ])
      .then(([s, m, dashboard, verifications]) => {
        setStats(s);
        setMarketplace(dashboard);
        setPendingVerifications(Array.isArray(verifications) ? verifications.length : 0);
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

  const alerts = [
    pendingVerifications > 0 && {
      icon: "verified_user",
      title: `${pendingVerifications} verificación(es) en cola`,
      body: "Revisar identidad y escalar a Stripe si hace falta.",
      href: "/admin/verificaciones",
      urgent: true,
    },
    stats.openReports > 0 && {
      icon: "flag",
      title: `${stats.openReports} reporte(s) abiertos`,
      body: "Moderación pendiente de perfiles, espacios o mensajes.",
      href: "/admin/reportes",
      urgent: stats.openReports >= 3,
    },
    stats.listingsDraft > 5 && {
      icon: "edit_note",
      title: `${stats.listingsDraft} borradores de espacios`,
      body: "Listings sin publicar que pueden activar oferta.",
      href: "/admin/espacios",
      urgent: false,
    },
  ].filter(Boolean) as Array<{
    icon: string;
    title: string;
    body: string;
    href: string;
    urgent: boolean;
  }>;

  return (
    <AdminPageShell
      title={es.admin.commandCenter.title}
      subtitle={es.admin.commandCenter.subtitle}
      actions={
        <span className="rounded-full bg-surface-container px-3 py-1.5 text-label-sm text-warm-slate">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      }
    >
      <AdminIntegrationHealthBar />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/usuarios" className="block">
          <AdminStatCard label={es.admin.stats.users} value={stats.users} icon="group" />
        </Link>
        <Link to="/admin/espacios" className="block">
          <AdminStatCard label={es.admin.stats.listingsPublished} value={stats.listingsPublished} icon="apartment" />
        </Link>
        <Link to="/admin/verificaciones" className="block">
          <AdminStatCard
            label="Verificaciones en cola"
            value={pendingVerifications}
            icon="verified_user"
            trend={pendingVerifications > 0 ? "Requiere acción" : "Al día"}
          />
        </Link>
        <Link to="/admin/reportes" className="block">
          <AdminStatCard label={es.admin.stats.openReports} value={stats.openReports} icon="flag" />
        </Link>
      </div>

      {alerts.length > 0 && (
        <AdminSection
          title={es.admin.commandCenter.alertsTitle}
          description={es.admin.commandCenter.alertsSubtitle}
          className="mt-6"
        >
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.href}>
                <Link
                  to={alert.href}
                  className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
                    alert.urgent
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-border-light bg-white hover:border-teal-accent/30"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      alert.urgent ? "bg-amber-100 text-amber-800" : "bg-teal-accent/10 text-teal-accent"
                    }`}
                  >
                    <Icon name={alert.icon} className="text-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-deep-navy">{alert.title}</p>
                    <p className="mt-0.5 text-body-sm text-warm-slate">{alert.body}</p>
                  </div>
                  <Icon name="chevron_right" className="shrink-0 text-warm-slate" />
                </Link>
              </li>
            ))}
          </ul>
        </AdminSection>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AdminSection
          title={es.admin.commandCenter.quickActions}
          className="lg:col-span-1"
        >
          <div className="grid grid-cols-2 gap-2">
            {PRIORITY_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-2 rounded-xl border border-border-light bg-white p-4 text-center transition-all hover:border-teal-accent/40 hover:shadow-sm"
              >
                <Icon name={item.icon} className={`text-[28px] ${item.color}`} />
                <span className="text-label-sm font-medium text-deep-navy">{item.label}</span>
              </Link>
            ))}
          </div>
        </AdminSection>

        {moonAccess && (
          <AdminSection
            title={es.admin.moonAccess.title}
            description={es.admin.moonAccess.note}
            className="lg:col-span-2"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-display-sm text-deep-navy">
                  {moonAccess.userCount}
                  <span className="text-headline-md text-warm-slate"> / {moonAccess.threshold}</span>
                </p>
                <p className="mt-1 text-label-sm text-warm-slate">{es.admin.moonAccess.userCount}</p>
              </div>
              <p
                className={`rounded-full px-4 py-1.5 text-label-sm font-semibold ${
                  moonAccess.readyToEnable
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-surface-container text-warm-slate"
                }`}
              >
                {moonAccess.readyToEnable ? es.admin.moonAccess.ready : es.admin.moonAccess.notReady}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-teal-accent transition-all"
                style={{ width: `${Math.min(100, (moonAccess.userCount / moonAccess.threshold) * 100)}%` }}
              />
            </div>
          </AdminSection>
        )}
      </div>

      {marketplace && (
        <AdminSection
          title="Funnel marketplace"
          description="Vista ejecutiva — detalle en cada módulo operativo."
          className="mt-6"
          actions={
            <Link to="/admin/matching" className="text-label-sm font-medium text-teal-accent hover:underline">
              Ver matching →
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Solicitudes", marketplace.funnel.applicationsCreated],
              ["Matches enviados", marketplace.funnel.matchesSent],
              ["Aceptados", marketplace.funnel.matchesAccepted],
              ["Entradas confirmadas", marketplace.funnel.confirmedEntries],
              [
                "Comisión estimada",
                `${marketplace.funnel.estimatedCommission.toLocaleString("es-ES")} €`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-container p-4">
                <p className="text-label-sm text-warm-slate">{label}</p>
                <p className="mt-1 text-headline-sm text-deep-navy">{value}</p>
              </div>
            ))}
          </div>
        </AdminSection>
      )}
    </AdminPageShell>
  );
}
