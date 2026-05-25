import { Link, Outlet, useLocation } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

const AUTH_SHELL_PATHS = ["/access", "/olvide-contrasena"];

/** Cabecera mínima en registro, onboarding y cuestionario (con cerrar sesión). */
export function FunnelLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const authShell = AUTH_SHELL_PATHS.includes(pathname);

  return (
    <div className={`min-h-screen ${authShell ? "bg-stone-100" : "bg-background"}`}>
      {authShell ? (
        user ? (
          <div className="fixed top-4 right-4 z-50 sm:top-5 sm:right-6">
            <button
              type="button"
              onClick={() => signOut().then(() => window.location.assign("/"))}
              className="rounded-full border border-stone-200/80 bg-white/90 px-4 py-2 text-[13px] font-medium text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:text-stone-900"
            >
              {es.common.signOut}
            </button>
          </div>
        ) : null
      ) : (
        <header className="glass-header fixed inset-x-0 top-0 z-50">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
            <Link to="/" className="inline-flex items-center">
              <Logo variant="dark" height={24} />
            </Link>
            {user && (
              <button
                type="button"
                onClick={() => signOut().then(() => window.location.assign("/"))}
                className="text-label-md text-stone-400 transition-colors hover:text-white"
              >
                {es.common.signOut}
              </button>
            )}
          </div>
        </header>
      )}
      <Outlet />
    </div>
  );
}
