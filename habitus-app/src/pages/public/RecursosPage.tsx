import { Link } from "react-router-dom";
import { FileText, ListChecks, BookOpen, ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import { usePageMeta } from "../../hooks/usePageMeta";

const RECURSOS = [
  {
    icon: FileText,
    title: "Acuerdo de Convivencia",
    description: "Plantilla completa para regular gastos, normas, incidencias y salida. Lista para firmar digitalmente en moon.",
    to: "/recursos/acuerdo-convivencia",
    tag: "Plantilla",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ListChecks,
    title: "Inventario del piso",
    description: "Checklist de entrada/salida: cocina, baños, habitaciones, electrodomésticos. Protege tu fianza con fotos y firmas.",
    to: "/recursos/inventario-piso",
    tag: "Checklist",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: BookOpen,
    title: "Guía de convivencia",
    description: "Las 10 reglas no escritas de los pisos que funcionan. Directa, práctica y sin perorata.",
    to: "/recursos/guia-convivencia",
    tag: "Guía",
    color: "bg-amber-50 text-amber-600",
  },
];

export function RecursosPage() {
  usePageMeta(
    "Recursos gratuitos para pisos compartidos | : moon",
    "Descarga gratis: acuerdo de convivencia, inventario del piso y guía de convivencia. Herramientas de moon para pisos compartidos en Barcelona y Madrid.",
    "/recursos",
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-stone-950 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
            <DownloadSimple size={12} weight="bold" />
            Herramientas gratuitas
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Recursos para tu piso compartido
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Descarga gratis las plantillas que usan los pisos que no tienen problemas.
            Sin registro obligatorio.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="grid gap-6">
          {RECURSOS.map(({ icon: Icon, title, description, to, tag, color }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-5 p-6 rounded-2xl border border-stone-100 hover:border-stone-300 hover:shadow-md transition-all bg-white"
            >
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon size={22} weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{tag}</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors">{title}</h2>
                <p className="text-stone-500 text-sm mt-1 leading-relaxed">{description}</p>
              </div>
              <ArrowRight size={18} className="text-stone-300 group-hover:text-stone-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </Link>
          ))}
        </div>

        {/* Also calculator */}
        <div className="mt-8 p-5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-stone-800">Calculadora de alquiler justo</p>
            <p className="text-stone-500 text-sm">Divide el alquiler según el tamaño de cada habitación. Gratis e instantáneo.</p>
          </div>
          <Link
            to="/calculadora-alquiler"
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white font-semibold rounded-xl text-sm hover:bg-stone-700 transition-colors shrink-0"
          >
            Calcular <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-stone-950 text-white py-14 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">¿Tienes piso? Gestiona todo en moon</h2>
          <p className="text-white/60 mb-7 text-sm">
            Gastos, incidencias, acuerdo digital y Moon Score de reputación. Gratis para inquilinos.
          </p>
          <Link
            to="/access?signup=1&role=inquilino"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors"
          >
            Empezar gratis <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </div>
  );
}
