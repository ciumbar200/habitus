import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  buildCategoryFilters,
  es,
  fetchCategories,
  fetchCompatQuiz,
  fetchProperties,
  getZonesForCity,
  isMoonCitySlug,
  matchesCityZoneFilter,
  MOON_CITIES,
  type Category,
  type MoonCitySlug,
  type Property,
} from "@habitus/core";
import { PropertyCard } from "../../components/PropertyCard";
import { LoadingState, ErrorState } from "../../components/PageState";
import { usePageMeta } from "../../hooks/usePageMeta";
import { accessSignupUrl } from "../../lib/accessLinks";
import { LISTINGS_HERO_IMAGE } from "../../lib/brandAssets";
import { useAuth } from "../../context/AuthContext";
import { useBookmarks } from "../../hooks/useBookmarks";
import { isSupabaseConfigured } from "../../lib/supabase";

type SortKey = "compatibilidad" | "precio_asc" | "precio_desc" | "recientes";
type CityKey = MoonCitySlug | "";
type PriceKey = "" | "400" | "400-600" | "600-800" | "800-1000" | "1000+";

const PL = es.publicListings;

function parsePriceBand(band: PriceKey): { min: number; max: number | null } {
  switch (band) {
    case "400":
      return { min: 0, max: 400 };
    case "400-600":
      return { min: 400, max: 600 };
    case "600-800":
      return { min: 600, max: 800 };
    case "800-1000":
      return { min: 800, max: 1000 };
    case "1000+":
      return { min: 1000, max: null };
    default:
      return { min: 0, max: null };
  }
}

function filterProperties(
  list: Property[],
  city: CityKey,
  zone: string,
  priceBand: PriceKey,
): Property[] {
  const { min, max } = parsePriceBand(priceBand);
  return list.filter((p) => {
    if (!matchesCityZoneFilter(p.city, p.location, city, zone)) return false;
    if (p.price < min) return false;
    if (max !== null && p.price > max) return false;
    return true;
  });
}

function sortProperties(list: Property[], sort: SortKey): Property[] {
  const copy = [...list];
  switch (sort) {
    case "precio_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "precio_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "recientes":
      return copy.sort((a, b) => (b.availableFrom ?? "").localeCompare(a.availableFrom ?? ""));
    case "compatibilidad":
    default:
      return copy.sort((a, b) => (b.compatibility ?? -1) - (a.compatibility ?? -1));
  }
}

function avgCompat(list: Property[]): number | null {
  const scores = list.map((p) => p.compatibility).filter((s): s is number => s != null && s > 0);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function PublicListingsPage() {
  usePageMeta(PL.metaTitle, PL.metaDescription);

  const { user } = useAuth();
  const { isListingSaved, toggleListing } = useBookmarks();
  const [searchParams, setSearchParams] = useSearchParams();

  const cityRaw = searchParams.get("ciudad") ?? "";
  const city: CityKey = isMoonCitySlug(cityRaw) ? cityRaw : "";
  const zone = searchParams.get("zona") ?? "";
  const priceBand = (searchParams.get("precio") ?? "") as PriceKey;
  const sort = (searchParams.get("orden") ?? "compatibilidad") as SortKey;
  const category = searchParams.get("categoria") ?? "all";

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasQuiz, setHasQuiz] = useState(false);

  function patchParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(patch)) {
      if (val == null || val === "") next.delete(key);
      else next.set(key, val);
    }
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }
    fetchCategories()
      .then((cats) => setCategories(buildCategoryFilters(cats, es.discover.allCategories)))
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);

    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});
    quizPromise
      .then((quiz) => {
        setHasQuiz(Object.keys(quiz).length > 0);
        return fetchProperties(category, quiz);
      })
      .then(setAllProperties)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [category, user?.id]);

  const properties = useMemo(
    () => sortProperties(filterProperties(allProperties, city, zone, priceBand), sort),
    [allProperties, city, zone, priceBand, sort],
  );

  const compatAvg = useMemo(() => avgCompat(properties), [properties]);
  const showCompatHint = !user || !hasQuiz;

  return (
    <main className="pb-20">
      {/* Hero con foto — estilo : moon */}
      <section className="relative min-h-[440px] overflow-hidden border-b border-stone-800/30 sm:min-h-[480px] lg:min-h-[520px]">
        <img
          src={LISTINGS_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/60 to-stone-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />

        <div className="hero-shell-inner">
          <div className="max-w-2xl min-w-0">
            <div className="hero-badge">✨ {PL.badge}</div>
            <h1 className="hero-display">
              <span className="block">{PL.title}</span>
              <span className="hero-display-accent block">{PL.titleAccent}</span>
            </h1>
            <p className="hero-subtitle">{PL.subtitle}</p>
          </div>

          <div className="hero-stats max-w-3xl">
            <StatPill
              label={PL.statAvailable}
              value={loading ? "…" : String(properties.length)}
              light
            />
            <StatPill
              label={PL.statCompat}
              value={compatAvg != null ? `${compatAvg}%` : "—"}
              light
            />
            <StatPill label={PL.statSupport} value={PL.statSupportValue} light />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-64 lg:shrink-0">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
              {PL.filters}
            </h2>

            <FilterGroup label={PL.city}>
              {(
                [
                  ["", PL.cityAll],
                  ...MOON_CITIES.map((c) => [c.slug, c.label] as const),
                ] as const
              ).map(([val, label]) => (
                <FilterChip
                  key={val || "all"}
                  active={city === val}
                  onClick={() =>
                    patchParams({
                      ciudad: val || null,
                      zona: null,
                    })
                  }
                >
                  {label}
                </FilterChip>
              ))}
            </FilterGroup>

            {city && (
              <FilterGroup label={PL.zone}>
                {(
                  [
                    ["", PL.zoneAll],
                    ...getZonesForCity(city).map((z) => [z.slug, z.label] as const),
                  ] as const
                ).map(([val, label]) => (
                  <FilterChip
                    key={val || "all-zones"}
                    active={zone === val}
                    onClick={() => patchParams({ zona: val || null })}
                  >
                    {label}
                  </FilterChip>
                ))}
              </FilterGroup>
            )}

            <FilterGroup label={PL.price}>
              {(
                [
                  ["", PL.priceAny],
                  ["400", PL.priceUpTo400],
                  ["400-600", PL.price400_600],
                  ["600-800", PL.price600_800],
                  ["800-1000", PL.price800_1000],
                  ["1000+", PL.price1000Plus],
                ] as const
              ).map(([val, label]) => (
                <FilterChip
                  key={val || "any"}
                  active={priceBand === val}
                  onClick={() => patchParams({ precio: val || null })}
                >
                  {label}
                </FilterChip>
              ))}
            </FilterGroup>

            {categories.length > 0 && (
              <FilterGroup label={es.discover.allCategories}>
                {categories.map((cat) => (
                  <FilterChip
                    key={cat.slug}
                    active={category === cat.slug}
                    onClick={() => patchParams({ categoria: cat.slug === "all" ? null : cat.slug })}
                  >
                    {cat.label}
                  </FilterChip>
                ))}
              </FilterGroup>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-stone-700">
                <strong>
                  {loading
                    ? PL.resultsLoading
                    : PL.results.replace("{count}", String(properties.length))}
                </strong>
              </p>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                {PL.sortBy}
                <select
                  value={sort}
                  onChange={(e) => patchParams({ orden: e.target.value })}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
                >
                  <option value="compatibilidad">{PL.sortCompat}</option>
                  <option value="precio_asc">{PL.sortPriceAsc}</option>
                  <option value="precio_desc">{PL.sortPriceDesc}</option>
                  <option value="recientes">{PL.sortRecent}</option>
                </select>
              </label>
            </div>

            {showCompatHint && (
              <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-stone-700">
                {PL.compatHint}{" "}
                <Link to={accessSignupUrl("inquilino")} className="font-semibold text-emerald-800 hover:underline">
                  {PL.compatHintCta}
                </Link>
              </div>
            )}

            {loading && <LoadingState message={es.common.loading} />}
            {error && !loading && <ErrorState message={error} />}

            {!loading && !error && (
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {properties.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-stone-600">{PL.empty}</p>
                ) : (
                  properties.map((p) => (
                    <PropertyCard
                      key={p.slug}
                      property={p}
                      isSaved={user ? isListingSaved(p.slug) : false}
                      onToggleBookmark={user ? (slug) => toggleListing(slug) : undefined}
                    />
                  ))
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatPill({
  label,
  value,
  light = false,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div
      className={
        light
          ? "rounded-xl border border-white/15 bg-white/10 px-5 py-4 shadow-lg backdrop-blur-md"
          : "rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm"
      }
    >
      <p className={`text-2xl font-semibold ${light ? "text-white" : "text-stone-900"}`}>{value}</p>
      <p className={`mt-1 text-sm ${light ? "text-stone-300" : "text-stone-500"}`}>{label}</p>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-stone-800">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-stone-900 text-white"
          : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
      }`}
    >
      {children}
    </button>
  );
}
