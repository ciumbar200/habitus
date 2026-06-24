import { Suspense, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "./Icon";
import { RouteTransition } from "./RouteTransition";
import { RouteFallback } from "./PageState";

type NavItem = { path: string; label: string; icon: string; end?: boolean };
type NavSection = { section: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    section: "Centro de mando",
    items: [
      { path: "/admin", label: es.admin.nav.commandCenter, icon: "dashboard", end: true },
    ],
  },
  {
    section: "Confianza",
    items: [
      { path: "/admin/verificaciones", label: es.admin.nav.verifications, icon: "verified_user" },
      { path: "/admin/reportes", label: es.admin.nav.reports, icon: "flag" },
      { path: "/admin/auditoria", label: es.admin.nav.audit, icon: "history" },
    ],
  },
  {
    section: "Marketplace",
    items: [
      { path: "/admin/usuarios", label: es.admin.nav.users, icon: "group" },
      { path: "/admin/matching", label: es.admin.nav.matching, icon: "hub" },
      { path: "/admin/solicitudes", label: es.admin.nav.applications, icon: "assignment" },
      { path: "/admin/espacios", label: es.admin.nav.listings, icon: "apartment" },
      { path: "/admin/habitaciones", label: es.admin.nav.rooms, icon: "bed" },
      { path: "/admin/grupos", label: es.admin.nav.groups, icon: "groups" },
    ],
  },
  {
    section: "Crecimiento",
    items: [
      { path: "/admin/embajadores", label: es.admin.nav.ambassadors, icon: "star" },
      { path: "/admin/comisiones", label: es.admin.nav.commissions, icon: "payments" },
      { path: "/admin/notificaciones", label: es.admin.nav.notifications, icon: "notifications" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { path: "/admin/integraciones", label: es.admin.nav.integrations, icon: "tune" },
      { path: "/admin/ia", label: es.admin.nav.ai, icon: "psychology" },
      { path: "/admin/configuracion", label: es.admin.nav.config, icon: "settings" },
    ],
  },
];

const NAV_FLAT = NAV_SECTIONS.flatMap((s) => s.items);

function currentNavItem(pathname: string): NavItem {
  return (
    NAV_FLAT.find((item) =>
      item.end === true ? pathname === item.path : pathname.startsWith(item.path),
    ) ?? NAV_FLAT[0]
  );
}

function currentSection(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    if (
      section.items.some((item) =>
        item.end === true ? pathname === item.path : pathname.startsWith(item.path),
      )
    ) {
      return section.section;
    }
  }
  return "Centro de mando";
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = useMemo(() => currentNavItem(pathname), [pathname]);
  const section = useMemo(() => currentSection(pathname), [pathname]);

  return (
    <div className="min-h-[100dvh] bg-[#f4f6f8]">
      <header className="fixed top-0 z-50 h-16 w-full border-b border-deep-navy/10 bg-deep-navy text-on-primary shadow-lg">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Icon name="admin_panel_settings" className="text-[22px]" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-on-primary/60">
                :moon · command center
              </p>
              <p className="text-label-md font-semibold">{es.admin.title}</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-label-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            <span className="hidden sm:inline">{es.admin.backToApp}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-0 px-margin-mobile pb-16 pt-20 md:gap-6 md:px-margin-desktop md:pt-24">
        <aside className="hidden w-[260px] shrink-0 md:block">
          <nav className="sticky top-24 overflow-hidden rounded-2xl bg-deep-navy shadow-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-primary/50">
                Navegación
              </p>
            </div>
            <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto p-3">
              {NAV_SECTIONS.map((navSection) => (
                <div key={navSection.section} className="mb-4 last:mb-0">
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-primary/40">
                    {navSection.section}
                  </p>
                  <ul className="space-y-0.5">
                    {navSection.items.map((item) => {
                      const isActive =
                        item.end === true ? pathname === item.path : pathname.startsWith(item.path);
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-sm font-medium transition-all ${
                              isActive
                                ? "bg-white text-deep-navy shadow-md"
                                : "text-on-primary/80 hover:bg-white/10 hover:text-on-primary"
                            }`}
                          >
                            <Icon name={item.icon} className="text-[18px]" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 md:hidden">
            <div className="mb-2 flex items-center gap-2 text-label-sm text-warm-slate">
              <span className="font-medium">{section}</span>
              <Icon name="chevron_right" className="text-[16px]" />
              <span className="text-deep-navy">{active.label}</span>
            </div>
            <select
              value={active.path}
              onChange={(e) => navigate(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-light bg-white py-3 pl-4 pr-10 text-label-sm font-medium text-deep-navy shadow-sm"
              aria-label="Navegación admin"
            >
              {NAV_SECTIONS.map((navSection) => (
                <optgroup key={navSection.section} label={navSection.section}>
                  {navSection.items.map((item) => (
                    <option key={item.path} value={item.path}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border-light/80 md:p-8">
            <Suspense fallback={<RouteFallback />}>
              <RouteTransition />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
