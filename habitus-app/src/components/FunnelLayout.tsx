import { Link, Outlet } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

/** Cabecera mínima en registro, onboarding y cuestionario (con cerrar sesión). */
export function FunnelLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
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
      <Outlet />
    </div>
  );
}
