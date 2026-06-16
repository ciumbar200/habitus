import { Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "./Icon";
import { RouteTransition } from "./RouteTransition";
import { RouteFallback } from "./PageState";

type NavItem = { path: string; label: string; icon: string; end?: boolean };
type NavSection = { section: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    section: "Core",
    items: [
      { path: "/admin", label: es.admin.nav.dashboard, icon: "dashboard", end: true },
    ],
  },
  {
    section: "Personas",
    items: [
      { path: "/admin/usuarios", label: es.admin.nav.users, icon: "group" },
      { path: "/admin/verificaciones", label: "Verificaciones", icon: "verified_user" },
      { path: "/admin/embajadores", label: es.admin.nav.ambassadors, icon: "star" },
      { path: "/admin/comisiones", label: es.admin.nav.commissions, icon: "payments" },
    ],
  },
  {
    section: "Operaciones",
    items: [
      { path: "/admin/matching", label: es.admin.nav.matching, icon: "hub" },
      { path: "/admin/solicitudes", label: es.admin.nav.applications, icon: "assignment" },
      { path: "/admin/espacios", label: es.admin.nav.listings, icon: "apartment" },
      { path: "/admin/habitaciones", label: es.admin.nav.rooms, icon: "bed" },
      { path: "/admin/grupos", label: es.admin.nav.groups, icon: "groups" },
    ],
  },
  {
    section: "Plataforma",
    items: [
      { path: "/admin/reportes", label: es.admin.nav.reports, icon: "flag" },
      { path: "/admin/notificaciones", label: es.admin.nav.notifications, icon: "notifications" },
      { path: "/admin/configuracion", label: es.admin.nav.config, icon: "tune" },
      { path: "/admin/auditoria", label: es.admin.nav.audit, icon: "history" },
      { path: "/admin/ia", label: "Control IA", icon: "psychology" },
    ],
  },
];

const NAV_FLAT = NAV_SECTIONS.flatMap((s) => s.items);

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="fixed top-0 z-50 h-16 w-full border-b border-border-light bg-surface-container-lowest">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-3">
            <Icon name="admin_panel_settings" className="text-[28px] text-teal-accent" />
            <span className="text-headline-md text-deep-navy">{es.admin.title}</span>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            {es.admin.backToApp}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-margin-mobile pb-16 pt-24 md:px-margin-desktop">
        <nav className="hidden w-52 shrink-0 flex-col gap-4 md:flex">
          {NAV_SECTIONS.map((section) => (
            <div key={section.section}>
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-warm-slate/60">
                {section.section}
              </p>
              {section.items.map((item) => {
                const active =
                  item.end === true ? pathname === item.path : pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-label-md transition-colors ${
                      active
                        ? "bg-deep-navy text-on-primary"
                        : "text-deep-navy hover:bg-surface-container"
                    }`}
                  >
                    <Icon name={item.icon} className="text-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {NAV_FLAT.map((item) => {
              const active =
                item.end === true ? pathname === item.path : pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`shrink-0 rounded-full px-4 py-2 text-label-sm ${
                    active
                      ? "bg-deep-navy text-on-primary"
                      : "border border-border-light text-deep-navy"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Suspense fallback={<RouteFallback />}>
            <RouteTransition />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
