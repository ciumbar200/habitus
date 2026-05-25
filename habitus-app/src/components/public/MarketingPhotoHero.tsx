import type { ReactNode } from "react";

export type HeroStat = { label: string; value: string };

type MarketingPhotoHeroProps = {
  image: string;
  badge: string;
  title: ReactNode;
  subtitle: ReactNode;
  stats?: HeroStat[];
  actions?: ReactNode;
};

/** Hero con foto a pantalla ancha (alojamientos, landings por audiencia). */
export function MarketingPhotoHero({
  image,
  badge,
  title,
  subtitle,
  stats,
  actions,
}: MarketingPhotoHeroProps) {
  return (
    <section className="relative min-h-[480px] overflow-hidden border-b border-stone-800/30 sm:min-h-[500px] lg:min-h-[540px]">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/88 via-stone-900/65 to-stone-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />

      <div className="hero-shell-inner">
        <div className="max-w-2xl min-w-0">
          <div className="hero-badge">✨ {badge}</div>
          <h1 className="hero-display">{title}</h1>
          <div className="hero-subtitle">{subtitle}</div>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="hero-stats max-w-3xl">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md sm:px-5 sm:py-4"
              >
                <p className="text-xl font-semibold text-white sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-xs text-stone-300 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
