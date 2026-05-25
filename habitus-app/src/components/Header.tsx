import { Link, useLocation } from "react-router-dom";
import { homePathForRole, navItemsForRole, normalizeImageUrl } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { Icon } from "./Icon";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";
import { useState, useEffect } from "react";
import { useScrollLock } from "../lib/useScrollLock";

const FALLBACK_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyG1Vj2fNf0xSTn63zYFOCzosjrxS4Cxbm7MCGcUFHRWN25GbwAuKi1Y4SCoqfHdiF7EJGcO2DYT1RSJurWKPTmuR96Rubez-y-Y6vdYNi1L8c9zIh4Ar2Ng2LGa7n0TPqyCyhqdYxDAZwtNB13MJCUja1gTM2aNQ5Wmi65W0VwCrRf903QB46g2WIBd15QXDDTHugUMKwDaVb1vT8P_K1N3UA7GSdne1JL-DfKFMOz9Y-FZpCzh63-lvh0JnjexqpJaAJS4hI6lQ";

type HeaderProps = {
  showBack?: boolean;
};

export function Header({ showBack }: HeaderProps) {
  const location = useLocation();
  const { profile, user } = useAuth();
  const avatar = normalizeImageUrl(profile?.avatarUrl) ?? FALLBACK_AVATAR;
  const navItems = user ? navItemsForRole(profile?.accountRole) : [];
  const onProperty = location.pathname.startsWith("/property/");
  const useBack = showBack || onProperty;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useScrollLock(mobileMenuOpen);

  // Icon mapping for nav items
  const getIconForPath = (path: string): string => {
    if (path === "/descubrir") return "explore";
    if (path === "/matches") return "group";
    if (path === "/comunidad") return "groups";
    if (path === "/messages") return "chat_bubble";
    if (path === "/profile") return "person";
    if (path === "/grupos") return "groups";
    if (path.startsWith("/panel")) return "dashboard";
    return "chevron_right";
  };

  return (
    <>
      <header className="glass-header fixed top-0 z-50 w-full border-b border-border-light pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex min-w-0 items-center gap-3">
            {useBack ? (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:opacity-70"
                aria-label={es.common.back}
              >
                <Icon name="arrow_back" />
              </button>
            ) : null}
            <Link
              to={user ? homePathForRole(profile?.accountRole) : "/"}
              className="inline-flex shrink-0 items-center"
            >
              <Logo variant="dark" height={24} />
            </Link>
          </div>

          {/* Desktop Navigation - always visible on desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-label-md font-medium transition-all hover:opacity-80 ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "text-white"
                    : "text-stone-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: User Menu or Sign In */}
          <div className="hidden md:flex">
            {user ? (
              <UserMenu variant="dark" />
            ) : (
              <Link
                to="/access"
                className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-white transition-opacity active:opacity-80"
              >
                {es.common.signIn}
              </Link>
            )}
          </div>

          {/* Mobile: cuenta + navegación principal */}
          <div className="flex items-center gap-2 md:hidden">
            {!user ? (
              <Link
                to="/access"
                className="rounded-lg bg-deep-navy px-3 py-1.5 text-label-sm text-white transition-opacity active:opacity-80"
              >
                {es.common.signIn}
              </Link>
            ) : (
              <>
                <UserMenu variant="dark" />
                {navItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-all active:bg-white/20"
                    aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={mobileMenuOpen}
                  >
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`h-0.5 w-5 bg-white transition-all ${
                          mobileMenuOpen ? "translate-y-2 rotate-45" : ""
                        }`}
                      />
                      <span
                        className={`h-0.5 w-5 bg-white transition-all ${
                          mobileMenuOpen ? "opacity-0" : ""
                        }`}
                      />
                      <span
                        className={`h-0.5 w-5 bg-white transition-all ${
                          mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
                        }`}
                      />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Drawer */}
      {mobileMenuOpen && navItems.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="fixed right-0 top-0 z-[70] h-full w-full max-w-xs animate-slide-in-from-right md:max-w-sm">
            <div className="flex h-full flex-col bg-stone-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-accent to-emerald-600">
                    <Icon name="moon" className="text-white" />
                  </div>
                  <span className="text-label-md font-semibold text-white">Menú</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <Icon name="x" className="text-xl" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== "/" && location.pathname.startsWith(item.path));

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-4 rounded-xl px-4 py-4 transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-teal-accent/20 to-emerald-600/20 text-white"
                              : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-teal-accent/20"
                              : "bg-white/5"
                          }`}>
                            <Icon
                              name={getIconForPath(item.path)}
                              className="text-lg"
                            />
                          </div>
                          <span className="flex-1 text-label-md">{item.label}</span>
                          {isActive && (
                            <div className="h-2 w-2 rounded-full bg-teal-accent" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer — acceso rápido al perfil (sin duplicar nav del drawer) */}
              <div className="border-t border-white/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="h-10 w-10 rounded-full border border-white/20 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-sm font-medium text-white">
                        {profile?.displayName || "Usuario"}
                      </p>
                      <p className="truncate text-label-sm text-stone-400">
                        {profile?.roleTitle || es.nav.myProfile}
                      </p>
                    </div>
                    <Icon name="chevron_right" className="text-stone-500" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
