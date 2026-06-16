import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import type { AccountRoleSlug } from "@habitus/core";
import { accessSignupUrl, howItWorksUrl, parseAccessRole } from "../../lib/accessLinks";
import { getHowItWorksRoles, type HowItWorksRoleConfig } from "../../lib/howItWorksContent";
import { useI18n } from "../../lib/I18nContext";
import { usePageMeta } from "../../hooks/usePageMeta";

const HEADER_OFFSET = 112;

function scrollToRole(role: AccountRoleSlug) {
  const el = document.getElementById(`role-${role}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export function HowItWorksPage() {
  const t = useI18n();
  usePageMeta(t.public.meta.howItWorksTitle, t.public.meta.howItWorksDescription, "/como-funciona");
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const hw = t.public.howItWorksPage;
  const roles = useMemo(() => getHowItWorksRoles(t), [t]);

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
          <p className="section-eyebrow text-terracotta">{hw.eyebrow}</p>
          <h1 className="section-title mt-3">
            {hw.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
            {hw.subtitle}
          </p>
        </div>

        {/* Role nav — sticky */}
        <div className="sticky top-16 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3 lg:px-8">
            {roles.map((role) => {
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
              title: hw.pillar1Title,
              text: hw.pillar1Text,
            },
            {
              title: hw.pillar2Title,
              text: hw.pillar2Text,
            },
            {
              title: hw.pillar3Title,
              text: hw.pillar3Text,
            },
          ].map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="card-title">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-role sections */}
      {roles.map((role) => (
        <RoleSection key={role.slug} config={role} highlighted={activeRole === role.slug} t={t} />
      ))}

      <section className="mx-auto max-w-3xl px-6 pt-8 text-center lg:px-8">
        <p className="text-sm text-stone-500">
          {hw.betaNote}
        </p>
        <Link
          to="/alojamientos"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
        >
          {hw.exploreListings}
          <ArrowRight weight="bold" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

function RoleSection({
  config,
  highlighted,
  t,
}: {
  config: HowItWorksRoleConfig;
  highlighted: boolean;
  t: ReturnType<typeof useI18n>;
}) {
  const hw = t.public.howItWorksPage;

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
            <p className={`section-eyebrow ${config.accent}`}>
              {hw.forRoleLabel.replace("{role}", config.labelPlural)}
            </p>
            <h2 className="section-title mt-3 lg:text-4xl">{config.headline}</h2>
            <p className="mt-4 text-stone-600 leading-relaxed">{config.intro}</p>
            <Link
              to={config.landingPath}
              className={`mt-4 inline-flex text-sm font-medium ${config.accentMuted} hover:underline`}
            >
              {hw.viewRoleLanding.replace("{role}", config.label.toLowerCase())}
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
                <span className={`step-number text-2xl sm:text-3xl ${config.accent} opacity-40 group-hover:opacity-70`}>
                  {step.num}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.accentBg}`}>
                      <step.icon size={18} weight="bold" className={config.accent} />
                    </div>
                    <h3 className="card-title">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.desc}</p>
                </div>
              </div>
            ))}

            {config.extras && (
              <div className={`rounded-2xl border border-dashed p-5 ${config.accentRing} ${config.accentBg}/50`}>
                <h3 className="card-title">{config.extras.title}</h3>
                <ul className="mt-3 space-y-2">
                  {config.extras.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-stone-600">
                      <CheckCircle size={18} weight="fill" className={`mt-0.5 shrink-0 ${config.accent}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                {config.slug === "propietario" && (
                  <Link to="/operadores" className={`mt-4 inline-flex text-sm font-medium ${config.accentMuted} hover:underline`}>
                    {hw.knowAgencyFlow}
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
