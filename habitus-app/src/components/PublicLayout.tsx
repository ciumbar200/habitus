import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { useScrollLock } from "../lib/useScrollLock";
import { Header } from "./Header";
import { BottomNav, bottomNavClearance } from "./BottomNav";
import { Logo } from "./Logo";
import { Icon } from "./Icon";

const PUBLIC_NAV_LINKS = [
  { to: "/alojamientos", label: es.publicListings.exploreNav },
  { to: "/como-funciona", label: "Cómo funciona" },
  { to: "/anfitriones", label: "Anfitriones" },
  { to: "/propietarios", label: "Propietarios" },
  { to: "/agencias", label: "Agencias" },
] as const;

export function PublicLayout() {
  const { user, loading, profileReady } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useScrollLock(mobileMenuOpen);

  if (user && !loading && profileReady) {
    const navPad = bottomNavClearance();
    return (
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background">
        <Header />
        <main
          data-scroll-root
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
          style={{ paddingBottom: navPad, WebkitOverflowScrolling: "touch" }}
        >
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="glass-header fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center">
            <Logo variant="dark" height={30} />
          </Link>

          {/* Desktop */}
          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-stone-300 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/access"
              className="rounded-full bg-white px-5 py-2 text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              {es.common.signIn}
            </Link>
          </nav>

          {/* Mobile: acceso rápido + hamburguesa */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/access"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
            >
              {es.common.signIn}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
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
                  className={`h-0.5 w-5 bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`h-0.5 w-5 bg-white transition-all ${
                    mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] animate-fade-in bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-[70] h-full w-full max-w-xs animate-slide-in-from-right md:hidden">
            <div className="flex h-full flex-col bg-stone-900">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
                <Logo variant="dark" height={26} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <Icon name="x" className="text-xl" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {PUBLIC_NAV_LINKS.map((item) => {
                    const isActive =
                      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-stone-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <Link
                  to="/access"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-medium text-stone-900"
                >
                  {es.common.signIn}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      <Outlet />

      <footer className="border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <Logo variant="light" height={32} className="mx-auto md:mx-0" />
              <p className="mt-2 text-sm text-stone-500">vivienda compartida con compatibilidad</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
              <Link to="/" className="text-stone-600 transition-colors hover:text-stone-900">
                Inicio
              </Link>
              {PUBLIC_NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-stone-600 transition-colors hover:text-stone-900"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/privacidad" className="text-stone-600 transition-colors hover:text-stone-900">
                {es.legal.privacy}
              </Link>
              <Link to="/terminos" className="text-stone-600 transition-colors hover:text-stone-900">
                {es.legal.terms}
              </Link>
              <Link to="/aviso-legal" className="text-stone-600 transition-colors hover:text-stone-900">
                {es.legal.notice}
              </Link>
            </div>
            <p className="text-sm text-stone-400">
              © 2026 {es.brandProduct} · barcelona · madrid · valencia · sevilla · granada
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
