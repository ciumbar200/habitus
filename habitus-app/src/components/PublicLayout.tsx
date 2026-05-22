import { Link, Outlet } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";

export function PublicLayout() {
  const { user, loading, profileReady } = useAuth();

  if (user && !loading && profileReady) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Outlet />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="glass-header fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center">
            <Logo variant="dark" height={30} />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/alojamientos" className="text-sm text-stone-300 transition-colors hover:text-white">
              {es.publicListings.exploreNav}
            </Link>
            <Link to="/como-funciona" className="text-sm text-stone-300 transition-colors hover:text-white">
              Cómo funciona
            </Link>
            <Link to="/anfitriones" className="text-sm text-stone-300 transition-colors hover:text-white">
              Anfitriones
            </Link>
            <Link to="/propietarios" className="text-sm text-stone-300 transition-colors hover:text-white">
              Propietarios
            </Link>
            <Link to="/agencias" className="text-sm text-stone-300 transition-colors hover:text-white">
              Agencias
            </Link>
            <Link
              to="/access"
              className="rounded-full bg-white px-5 py-2 text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              {es.common.signIn}
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <Logo variant="light" height={32} className="mx-auto md:mx-0" />
              <p className="text-sm text-stone-500 mt-2">vivienda compartida con compatibilidad</p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/" className="text-stone-600 hover:text-stone-900 transition-colors">Inicio</Link>
              <Link to="/alojamientos" className="text-stone-600 hover:text-stone-900 transition-colors">{es.publicListings.exploreNav}</Link>
              <Link to="/anfitriones" className="text-stone-600 hover:text-stone-900 transition-colors">Anfitriones</Link>
              <Link to="/propietarios" className="text-stone-600 hover:text-stone-900 transition-colors">Propietarios</Link>
              <Link to="/agencias" className="text-stone-600 hover:text-stone-900 transition-colors">Agencias</Link>
              <Link to="/como-funciona" className="text-stone-600 hover:text-stone-900 transition-colors">Cómo funciona</Link>
            </div>
            <p className="text-sm text-stone-400">© 2026 {es.brandProduct} · barcelona · madrid</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
