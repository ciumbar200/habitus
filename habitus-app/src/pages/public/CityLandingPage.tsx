import { Link } from "react-router-dom";
import { MOON_CITIES, MOON_ZONES_BY_CITY, type MoonCitySlug } from "@habitus/core";
import { HeroSearchForm } from "../../components/public/HeroSearchForm";
import { ArrowRight, MapPin, House, Users, Buildings } from "@phosphor-icons/react";
import { useI18n } from "../../lib/I18nContext";

/**
 * Generic city content - will work for all cities dynamically
 */
const getCityContent = (citySlug: MoonCitySlug) => {
  const city = MOON_CITIES.find((c) => c.slug === citySlug);
  const zones = MOON_ZONES_BY_CITY[citySlug];

  // Take top 5 zones for display
  const topZones = zones.slice(0, Math.min(6, zones.length));

  return {
    city,
    zones: topZones,
    allZones: zones,
  };
};

/**
 * Dynamic city-specific landing page - works for ALL Moon cities
 * No hardcoded Barcelona/Madrid references
 */
export function CityLandingPage({ citySlug }: { citySlug: MoonCitySlug }) {
  const t = useI18n();
  const copy = t.public.cityLanding;
  const content = getCityContent(citySlug);

  if (!content.city) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">{copy.notFoundTitle}</h1>
          <Link to="/" className="text-terracotta hover:underline">{copy.backHome}</Link>
        </div>
      </main>
    );
  }

  // Generic hero images by city (can be customized per city later)
  const heroImages: Record<MoonCitySlug, string> = {
    barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80",
    madrid: "https://images.unsplash.com/photo-1539069754734-9dc94477441b?w=1600&q=80",
    valencia: "https://images.unsplash.com/photo-1555992525-9748c6270500?w=1600&q=80",
    sevilla: "https://images.unsplash.com/photo-1563273911-cc5804d8fd59?w=1600&q=80",
    granada: "https://images.unsplash.com/photo-1585039345546-8fe90e14a2dc?w=1600&q=80",
  };
  const stats = [
    { value: `${content.allZones.length > 10 ? "100+" : content.allZones.length + "+"}`, label: copy.zonesAvailable },
    { value: "92%", label: copy.averageCompatibility },
    { value: "24h", label: copy.guaranteedResponse },
  ];
  const cityName = content.city.label;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero with search */}
      <section className="relative min-h-[500px] overflow-hidden border-b border-stone-800/30">
        <img
          src={heroImages[citySlug]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-900/72 to-stone-900/40" />

        <div className="hero-shell-inner">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <div className="hero-badge">✨ {content.city.label}</div>
              <h1 className="hero-display">
                <span className="block">{copy.heroTitle.replace("{city}", cityName)}</span>
              </h1>
              <p className="hero-subtitle">
                {copy.heroSubtitle}
              </p>

              {/* City stats */}
              <div className="hero-stats mt-6">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md"
                  >
                    <p className="text-base font-semibold text-white">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-stone-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:justify-self-end">
              <div className="absolute -top-3 -left-3 right-3 bottom-3 -z-10 hidden rounded-3xl bg-amber-400/20 rotate-3 blur-[1px] sm:block" />
              <HeroSearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Popular neighborhoods - Dynamic from MOON_ZONES_BY_CITY */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {copy.popularZonesTitle.replace("{city}", cityName)}
            </h2>
            <p className="text-stone-600">{copy.popularZonesSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {content.zones.map((zone) => (
              <Link
                key={zone.slug}
                to={`/alojamientos?city=${citySlug}&zone=${zone.slug}`}
                className="group rounded-xl bg-stone-100 p-4 text-center transition-all hover:bg-stone-200 hover:-translate-y-1"
              >
                <MapPin className="mx-auto mb-2 text-terracotta" size={24} weight="duotone" />
                <span className="text-sm font-medium text-stone-900">{zone.label}</span>
              </Link>
            ))}
          </div>

          {/* All zones link if there are more */}
          {content.allZones.length > 6 && (
            <div className="mt-6 text-center">
              <Link
                to={`/alojamientos?city=${citySlug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
              >
                {copy.viewAllZones.replace("{count}", String(content.allZones.length))}
                <ArrowRight weight="bold" size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Room types section */}
      <section className="py-16 bg-stone-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {copy.accommodationTypesTitle.replace("{city}", cityName)}
            </h2>
            <p className="text-stone-600">{copy.accommodationTypesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to={`/alojamientos?city=${citySlug}`}
              className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
                <House className="text-terracotta" size={24} weight="duotone" />
              </div>
              <div>
                <span className="font-medium text-stone-900">{copy.privateRoom}</span>
                <p className="text-sm text-stone-500">{copy.privateRoomDesc}</p>
              </div>
            </Link>

            <Link
              to={`/alojamientos?city=${citySlug}`}
              className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Buildings className="text-emerald-600" size={24} weight="duotone" />
              </div>
              <div>
                <span className="font-medium text-stone-900">{copy.entireHome}</span>
                <p className="text-sm text-stone-500">{copy.entireHomeDesc}</p>
              </div>
            </Link>

            <Link
              to={`/alojamientos?city=${citySlug}`}
              className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="text-blue-600" size={24} weight="duotone" />
              </div>
              <div>
                <span className="font-medium text-stone-900">{copy.formGroup}</span>
                <p className="text-sm text-stone-500">{copy.formGroupDesc}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-terracotta to-orange-600">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {copy.ctaTitle.replace("{city}", cityName)}
          </h2>
          <p className="text-white/80 mb-8">
            {copy.ctaSubtitle}
          </p>
          <Link
            to={`/alojamientos?city=${citySlug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-stone-900 transition-all hover:bg-stone-100 hover:shadow-lg"
          >
            {copy.ctaButton.replace("{city}", cityName)}
            <ArrowRight weight="bold" size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}
