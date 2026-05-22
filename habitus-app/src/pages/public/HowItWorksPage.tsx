import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import type { AccountRoleSlug } from "@habitus/core";
import { accessSignupUrl, howItWorksUrl, parseAccessRole } from "../../lib/accessLinks";
import { HOW_IT_WORKS_ROLES, type HowItWorksRoleConfig } from "../../lib/howItWorksContent";

const HEADER_OFFSET = 112;

function scrollToRole(role: AccountRoleSlug) {
  const el = document.getElementById(`role-${role}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export function HowItWorksPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const activeRole = useMemo(() => {
    const fromQuery = parseAccessRole(searchParams.get("role"));
    const fromHash = parseAccessRole(location.hash.replace("#", ""));
    return fromQuery ?? fromHash ?? null;
  }, [searchParams, location.hash]);

  useEffect(() => {
    if (!activeRole) return;
    const timer = window.setTimeout(() => scrollToRole(activeRole), 80);
    return () => window.clearTimeout(timer);
  }, [activeRole]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white pb-24">
      {/* Intro */}
      <section className="border-b border-stone-200 bg-white pt-28">
        <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-terracotta">Guía por rol</p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-stone-900 lg:text-5xl">
            cómo funciona : moon
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
            Misma plataforma, distintos caminos: elige tu rol y sigue los pasos. Compatibilidad, grupos e identidad
            verificada en el centro de cada flujo.
          </p>
        </div>

        {/* Role nav — sticky */}
        <div className="sticky top-16 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3 lg:px-8">
            {HOW_IT_WORKS_ROLES.map((role) => {
              const isActive = activeRole === role.slug;
              return (
                <Link
                  key={role.slug}
                  to={howItWorksUrl(role.slug)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? `${role.accentBg} ${role.accent} ring-1 ${role.accentRing}`
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {role.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shared pillars */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Compatibilidad real",
              text: "Cuestionario de estilo de vida con desglose claro de afinidad entre personas y espacios.",
            },
            {
              title: "Grupos que alquilan juntos",
              text: "Formad equipo, repartid el alquiler y desbloquead pisos privados cuando encajáis.",
            },
            {
              title: "Identidad y confianza",
              text: "Verificación demo, perfiles completos y mensajes antes de dar el paso.",
            },
          ].map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl text-stone-900">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-role sections */}
      {HOW_IT_WORKS_ROLES.map((role) => (
        <RoleSection key={role.slug} config={role} highlighted={activeRole === role.slug} />
      ))}

      <section className="mx-auto max-w-3xl px-6 pt-8 text-center lg:px-8">
        <p className="text-sm text-stone-500">
          : moon no es un seguro ni un servicio de mediación legal. fase beta gratuita — sin monetización activa.
        </p>
        <Link
          to="/alojamientos"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
        >
          Explorar alojamientos sin cuenta
          <ArrowRight weight="bold" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

function RoleSection({
  config,
  highlighted,
}: {
  config: HowItWorksRoleConfig;
  highlighted: boolean;
}) {
  return (
    <section
      id={`role-${config.slug}`}
      className={`scroll-mt-28 border-t border-stone-200 py-20 transition-colors ${
        highlighted ? "bg-stone-50/80" : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className={`text-sm font-medium uppercase tracking-wider ${config.accent}`}>
              Para {config.labelPlural}
            </p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900 lg:text-4xl">{config.headline}</h2>
            <p className="mt-4 text-stone-600 leading-relaxed">{config.intro}</p>
            <Link
              to={config.landingPath}
              className={`mt-4 inline-flex text-sm font-medium ${config.accentMuted} hover:underline`}
            >
              Ver landing de {config.label.toLowerCase()}
              <ArrowRight weight="bold" className="ml-1 h-4 w-4" />
            </Link>
            <Link
              to={accessSignupUrl(config.slug)}
              className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 ${
                config.slug === "inquilino"
                  ? "bg-stone-900 hover:bg-stone-800"
                  : config.slug === "anfitrion"
                    ? "bg-emerald-700 hover:bg-emerald-600"
                    : config.slug === "propietario"
                      ? "bg-amber-800 hover:bg-amber-700"
                      : "bg-stone-800 hover:bg-stone-700"
              }`}
            >
              {config.ctaLabel}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {config.steps.map((step) => (
              <div
                key={step.num}
                className="group flex gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
              >
                <span className={`font-serif text-3xl font-medium ${config.accent} opacity-40 group-hover:opacity-70`}>
                  {step.num}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.accentBg}`}>
                      <step.icon size={18} weight="bold" className={config.accent} />
                    </div>
                    <h3 className="font-serif text-lg text-stone-900">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.desc}</p>
                </div>
              </div>
            ))}

            {config.extras && (
              <div className={`rounded-2xl border border-dashed p-5 ${config.accentRing} ${config.accentBg}/50`}>
                <h3 className="font-serif text-lg text-stone-900">{config.extras.title}</h3>
                <ul className="mt-3 space-y-2">
                  {config.extras.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-stone-600">
                      <CheckCircle size={18} weight="fill" className={`mt-0.5 shrink-0 ${config.accent}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                {config.slug === "propietario" && (
                  <Link to="/agencias" className={`mt-4 inline-flex text-sm font-medium ${config.accentMuted} hover:underline`}>
                    Conocer flujo para agencias →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
