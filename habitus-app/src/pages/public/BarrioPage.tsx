import { useParams, Link, Navigate } from "react-router-dom";
import { MapPin, Train, Users, ArrowRight, Check, X, Lightbulb } from "@phosphor-icons/react";
import { isMoonCitySlug } from "@habitus/core";
import { getBarrioContent } from "../../data/barrioContent";
import { usePageMeta } from "../../hooks/usePageMeta";
import { accessSignupUrl } from "../../lib/accessLinks";

export function BarrioPage() {
  const { ciudad = "", barrio = "" } = useParams<{ ciudad: string; barrio: string }>();
  const content = isMoonCitySlug(ciudad) ? getBarrioContent(ciudad, barrio) : null;

  if (!content) return <Navigate to="/alojamientos" replace />;

  usePageMeta(content.seoTitle, content.seoDescription, `/habitaciones/${ciudad}/${barrio}`);

  const { min, max } = content.precioMedio;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-stone-950 text-white pt-14 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-1.5 text-white/40 text-xs mb-8">
            <Link to="/alojamientos" className="hover:text-white/70 transition-colors">Alojamientos</Link>
            <span>/</span>
            <Link to={`/alojamientos?ciudad=${ciudad}`} className="hover:text-white/70 transition-colors capitalize">{content.ciudad}</Link>
            <span>/</span>
            <span className="text-white/70">{content.barrio}</span>
          </nav>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={18} className="text-white/70" />
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">{content.ciudad}</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Habitación compartida<br />en {content.barrio}
              </h1>
            </div>
          </div>

          <p className="text-white/60 text-lg mt-4 max-w-xl leading-relaxed">{content.ambiente}</p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold">{min}–{max} €</p>
              <p className="text-white/50 text-xs mt-0.5">precio medio / mes</p>
            </div>
            <Link
              to={`/alojamientos?ciudad=${ciudad}&zona=${barrio}`}
              className="flex items-center gap-2 px-5 py-3 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors text-sm"
            >
              Ver habitaciones disponibles
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 grid gap-10">
        {/* Transport */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
            <Train size={20} className="text-stone-500" />
            Cómo moverse desde {content.barrio}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {content.transporte.map((t) => (
              <li key={t} className="bg-stone-100 text-stone-700 text-sm px-4 py-2 rounded-full">
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Pros / Cons */}
        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-4">Lo bueno y lo no tan bueno</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-2xl p-5">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">A favor</p>
              <ul className="space-y-2">
                {content.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-stone-700">
                    <Check size={14} className="text-green-500 shrink-0 mt-0.5" weight="bold" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl p-5">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">A tener en cuenta</p>
              <ul className="space-y-2">
                {content.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-stone-700">
                    <X size={14} className="text-red-400 shrink-0 mt-0.5" weight="bold" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Perfil del conviviente */}
        <section className="bg-stone-50 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-3">
            <Users size={20} className="text-stone-500" />
            ¿Quién vive en {content.barrio}?
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">{content.perfilConviviente}</p>
        </section>

        {/* Moon tip */}
        <section className="border-l-4 border-stone-900 pl-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-stone-700" weight="fill" />
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Consejo moon para {content.barrio}</span>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">{content.moonTip}</p>
        </section>

        {/* Price context */}
        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-4">Precios en {content.barrio}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-stone-900">{min} €</p>
              <p className="text-xs text-stone-500 mt-1">habitación pequeña<br />o sin extras</p>
            </div>
            <div className="bg-stone-900 text-white rounded-xl p-4">
              <p className="text-2xl font-bold">{Math.round((min + max) / 2)} €</p>
              <p className="text-xs text-white/60 mt-1">habitación media<br />típica del barrio</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-stone-900">{max} €</p>
              <p className="text-xs text-stone-500 mt-1">habitación grande<br />o con baño propio</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 text-center mt-3">
            Precios orientativos para pisos compartidos. Actualizado junio 2026.
            <Link to="/calculadora-alquiler" className="ml-1 underline hover:text-stone-600">Calcular reparto de alquiler →</Link>
          </p>
        </section>

        {/* CTA */}
        <section className="bg-stone-950 text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">
            Encuentra compañeros compatibles en {content.barrio}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            moon verifica la identidad de todos los perfiles y mide la compatibilidad real.
            Sin surpresas al mudarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/alojamientos?ciudad=${ciudad}&zona=${barrio}`}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors text-sm"
            >
              Ver habitaciones en {content.barrio}
            </Link>
            <Link
              to={accessSignupUrl("inquilino")}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              Crear perfil gratis <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* SEO internal links */}
        <section>
          <h2 className="text-base font-bold text-stone-900 mb-3">Otros barrios de {content.ciudad}</h2>
          <div className="flex flex-wrap gap-2">
            {ciudad === "barcelona" && (
              <>
                {["gracia", "poblenou", "eixample", "sants", "sant-antoni"]
                  .filter((b) => b !== barrio)
                  .map((b) => (
                    <Link
                      key={b}
                      to={`/habitaciones/barcelona/${b}`}
                      className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors capitalize"
                    >
                      {b.replace(/-/g, " ")}
                    </Link>
                  ))}
                <Link to="/habitaciones/madrid/malasana" className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors">
                  Madrid →
                </Link>
              </>
            )}
            {ciudad === "madrid" && (
              <>
                {["malasana", "chamberi", "centro", "retiro", "salamanca"]
                  .filter((b) => b !== barrio)
                  .map((b) => (
                    <Link
                      key={b}
                      to={`/habitaciones/madrid/${b}`}
                      className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors capitalize"
                    >
                      {b.replace(/-/g, " ")}
                    </Link>
                  ))}
                <Link to="/habitaciones/barcelona/gracia" className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors">
                  Barcelona →
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
