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
    <section className="relative min-h-[480px] overflow-hidden border-b border-stone-200 lg:min-h-[540px]">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/88 via-stone-900/65 to-stone-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-28 lg:px-8 lg:pb-16 lg:pt-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-stone-100 backdrop-blur-sm ring-1 ring-white/20">
            ✨ {badge}
          </div>
          <h1 className="mt-6 font-serif text-4xl font-medium tracking-tight text-white lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          <div className="mt-4 max-w-xl text-lg leading-relaxed text-stone-200">{subtitle}</div>
          {actions && <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 shadow-lg backdrop-blur-md"
              >
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-stone-300">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
