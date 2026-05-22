import { Link, Outlet, useLocation } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "./Icon";

const NAV: { path: string; label: string; icon: string; end?: boolean }[] = [
  { path: "/admin", label: es.admin.nav.dashboard, icon: "dashboard", end: true },
  { path: "/admin/usuarios", label: es.admin.nav.users, icon: "group" },
  { path: "/admin/espacios", label: es.admin.nav.listings, icon: "apartment" },
  { path: "/admin/reportes", label: es.admin.nav.reports, icon: "flag" },
];

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-surface">
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
        <nav className="hidden w-52 shrink-0 flex-col gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.end === true ? pathname === item.path : pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-label-md transition-colors ${
                  active
                    ? "bg-deep-navy text-on-primary"
                    : "text-deep-navy hover:bg-surface-container"
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {NAV.map((item) => {
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
          <Outlet />
        </div>
      </div>
    </div>
  );
}
