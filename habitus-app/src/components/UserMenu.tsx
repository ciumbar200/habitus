import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navItemsForRole, normalizeImageUrl } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../lib/I18nContext";
import { Icon } from "./Icon";

const FALLBACK_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyG1Vj2fNf0xSTn63zYFOCzosjrxS4Cxbm7MCGcUFHRWN25GbwAuKi1Y4SCoqfHdiF7EJGcO2DYT1RSJurWKPTmuR96Rubez-y-Y6vdYNi1L8c9zIh4Ar2Ng2LGa7n0TPqyCyhqdYxDAZwtNB13MJCUja1gTM2aNQ5Wmi65W0VwCrRf903QB46g2WIBd15QXDDTHugUMKwDaVb1vT8P_K1N3UA7GSdne1JL-DfKFMOz9Y-FZpCzh63-lvh0JnjexqpJaAJS4hI6lQ";

type UserMenuProps = {
  /** Header oscuro (glass): trigger integrado sin pill blanco. */
  variant?: "light" | "dark";
};

function isNavItemActive(pathname: string, path: string): boolean {
  return pathname === path || (path !== "/" && pathname.startsWith(path));
}

export function UserMenu({ variant = "light" }: UserMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = useI18n();

  const avatar = normalizeImageUrl(profile?.avatarUrl) ?? FALLBACK_AVATAR;
  const navItems = navItemsForRole(profile?.accountRole);
  const isDark = variant === "dark";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  if (!user) return null;

  const triggerClass = isDark
    ? "flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 py-1 pr-2 pl-1 text-white backdrop-blur-sm transition-colors hover:bg-white/15"
    : "flex items-center gap-2 rounded-full border border-border-light bg-white py-1 pr-3 pl-1 transition-colors hover:bg-surface-container-low";

  const chevronClass = isDark ? "text-[18px] text-white/80" : "text-[20px] text-deep-navy";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.openMenu}
      >
        <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20" />
        <Icon name={open ? "expand_less" : "expand_more"} className={chevronClass} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[80] mt-2 max-h-[min(70vh,32rem)] w-[min(calc(100vw-2rem),16rem)] overflow-y-auto rounded-xl border border-border-light bg-surface-container-lowest py-2 shadow-lg sm:w-56"
        >
          <div className="border-b border-border-light px-4 py-3">
            <p className="truncate text-label-md font-semibold text-deep-navy">
              {profile?.displayName ?? t.profile.memberFallback}
            </p>
            {profile?.roleTitle && (
              <p className="truncate text-label-sm text-warm-slate">{profile.roleTitle}</p>
            )}
          </div>

          {/* Móvil: navegación por rol (antes en la hamburguesa) */}
          {navItems.length > 0 && (
            <div className="border-b border-border-light py-1 md:hidden">
              {navItems.map((item) => {
                const active = isNavItemActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-label-md transition-colors ${
                      active
                        ? "bg-teal-accent/10 font-medium text-deep-navy"
                        : "text-deep-navy hover:bg-surface-container-low"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`text-[18px] ${active ? "text-teal-accent" : "text-warm-slate"}`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="py-1">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hidden items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low md:flex"
            >
              <Icon name="person" className="text-[18px] text-teal-accent" />
              {t.nav.myProfile}
            </Link>

            <Link
              to="/profile/editar"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low"
            >
              <Icon name="edit" className="text-[18px] text-teal-accent" />
              {t.profile.editProfile}
            </Link>

            {profile?.isAdmin && (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low"
              >
                <Icon name="admin_panel_settings" className="text-[18px] text-teal-accent" />
                {t.admin.nav.short}
              </Link>
            )}
          </div>

          <div className="border-t border-border-light pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-label-md text-error hover:bg-error-container/30"
            >
              <Icon name="logout" className="text-[18px]" />
              {t.common.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
