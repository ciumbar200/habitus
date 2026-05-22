import { Link, Outlet } from "react-router-dom";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="font-serif text-xl text-stone-900 font-medium tracking-tight">
            {es.brand}
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/como-funciona" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Cómo funciona
            </Link>
            <Link to="/anfitriones" className="text-sm text-stone-600 hover:text-emerald-700 transition-colors">
              Anfitriones
            </Link>
            <Link to="/propietarios" className="text-sm text-stone-600 hover:text-stone-700 transition-colors">
              Propietarios
            </Link>
            <Link
              to="/access"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm text-white hover:bg-stone-800 transition-colors"
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
              <p className="font-serif text-lg text-stone-900">{es.brand}</p>
              <p className="text-sm text-stone-500 mt-1">Vivienda compartida con compatibilidad</p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/" className="text-stone-600 hover:text-stone-900 transition-colors">Inicio</Link>
              <Link to="/anfitriones" className="text-stone-600 hover:text-stone-900 transition-colors">Anfitriones</Link>
              <Link to="/propietarios" className="text-stone-600 hover:text-stone-900 transition-colors">Propietarios</Link>
              <Link to="/como-funciona" className="text-stone-600 hover:text-stone-900 transition-colors">Cómo funciona</Link>
            </div>
            <p className="text-sm text-stone-400">© 2026 Habitus. Barcelona · Madrid</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
