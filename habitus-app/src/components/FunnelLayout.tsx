import { Link, Outlet } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";

/** Cabecera mínima en registro, onboarding y cuestionario (con cerrar sesión). */
export function FunnelLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border-light bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
          <Link to="/" className="text-headline-md text-deep-navy">
            {es.brand}
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => signOut().then(() => window.location.assign("/"))}
              className="text-label-md text-warm-slate hover:text-deep-navy"
            >
              {es.common.signOut}
            </button>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
