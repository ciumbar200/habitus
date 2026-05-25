import { useEffect, useState, type ReactNode } from "react";
import { House } from "@phosphor-icons/react";
import { LANDING_HERO_IMAGE } from "../../lib/brandAssets";

export type HeroListingSlide = {
  url: string;
  alt: string;
  title: string;
  location: string;
  affinity: string;
  tags: { label: string; value: string }[];
};

type LandingMainHeroProps = {
  badge: string;
  title: ReactNode;
  subtitle: ReactNode;
  actions?: ReactNode;
  stats?: { value: string; label: string }[];
  listings: HeroListingSlide[];
};

/** Hero principal: foto a pantalla ancha + carrusel de propiedades a la derecha. */
export function LandingMainHero({
  badge,
  title,
  subtitle,
  actions,
  stats,
  listings,
}: LandingMainHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (listings.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [listings.length]);

  const slide = listings[currentIndex] ?? listings[0];

  return (
    <section className="relative min-h-[560px] overflow-hidden border-b border-stone-800/30 sm:min-h-[520px] lg:min-h-[580px]">
      <img
        src={LANDING_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-900/72 to-stone-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent" />

      <div className="hero-shell-inner">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <div className="hero-badge">✨ {badge}</div>
            <h1 className="hero-display">{title}</h1>
            <div className="hero-subtitle">{subtitle}</div>
            {actions && <div className="hero-actions">{actions}</div>}

            {stats && stats.length > 0 && (
              <div className="hero-stats max-w-xl">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md"
                  >
                    <p className="text-base font-semibold text-white sm:text-lg">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-stone-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:justify-self-end">
            <div className="absolute -top-3 -left-3 right-3 bottom-3 -z-10 hidden rounded-3xl bg-amber-400/20 rotate-3 blur-[1px] sm:block" />
            <div className="absolute -top-1.5 -left-1.5 right-1.5 bottom-1.5 -z-10 hidden rounded-3xl bg-emerald-400/15 -rotate-2 blur-[1px] sm:block" />

            <div className="relative overflow-hidden rounded-2xl bg-white/95 shadow-2xl shadow-stone-950/40 ring-1 ring-white/20 sm:rounded-3xl">
              <div className="relative aspect-[4/3]">
                {listings.map((item, i) => (
                  <img
                    key={item.url}
                    src={item.url}
                    alt={item.alt}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      i === currentIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />

                <div className="absolute right-3 top-3 flex gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
                  {listings.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Ver propiedad ${i + 1}`}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:h-11 sm:w-11">
                      <House size={20} weight="fill" className="sm:hidden" />
                      <House size={22} weight="fill" className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-base font-semibold leading-tight sm:text-lg">{slide.title}</p>
                      <p className="text-xs text-white/80 sm:text-sm">
                        {slide.location} · {slide.affinity} afinidad
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {slide.tags.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-full bg-white/20 px-2.5 py-1 text-xs backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-sm"
                      >
                        <span className="text-white/70">{item.label}: </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
