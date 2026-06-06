import type { ReactNode } from "react";
import { LANDING_HERO_IMAGE } from "../../lib/brandAssets";

type LandingMainHeroProps = {
  badge: string;
  title: ReactNode;
  subtitle: ReactNode;
  actions?: ReactNode;
  stats?: { value: string; label: string }[];
  aside?: ReactNode;
};

/** Hero principal: copy a la izquierda + panel de conversión (búsqueda) a la derecha. */
export function LandingMainHero({
  badge,
  title,
  subtitle,
  actions,
  stats,
  aside,
}: LandingMainHeroProps) {
  return (
    <section className="relative overflow-x-hidden border-b border-stone-800/30 max-lg:min-h-0 lg:min-h-[580px]">
      <img
        src={LANDING_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-900/72 to-stone-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent" />

      {/* Soft conic glow behind the copy for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 rounded-full opacity-[0.18] blur-3xl lg:block animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 0deg, #c75b39, #e8a598, #059669, #c75b39)",
        }}
      />

      <div className="hero-shell-inner">
        <div className="grid min-w-0 items-center gap-8 max-lg:gap-6 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <div className="hero-badge animate-fade-in-up">✨ {badge}</div>
            <h1 className="hero-display animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              {title}
            </h1>
            <div className="hero-subtitle animate-fade-in-up" style={{ animationDelay: "180ms" }}>
              {subtitle}
            </div>
            {actions && (
              <div className="hero-actions animate-fade-in-up" style={{ animationDelay: "280ms" }}>
                {actions}
              </div>
            )}

            {stats && stats.length > 0 && (
              <div
                className="hero-stats max-w-xl animate-fade-in-up"
                style={{ animationDelay: "380ms" }}
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
                  >
                    <p className="text-base font-semibold text-white sm:text-lg">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-stone-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {aside && (
            <div className="relative mx-auto min-w-0 w-full max-w-md lg:max-w-none lg:justify-self-end animate-fade-in-up" style={{ animationDelay: "220ms" }}>
              <div className="absolute -top-3 -left-3 right-3 bottom-3 -z-10 hidden rounded-3xl bg-amber-400/20 rotate-3 blur-[1px] sm:block" />
              <div className="absolute -top-1.5 -left-1.5 right-1.5 bottom-1.5 -z-10 hidden rounded-3xl bg-emerald-400/15 -rotate-2 blur-[1px] sm:block" />
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
