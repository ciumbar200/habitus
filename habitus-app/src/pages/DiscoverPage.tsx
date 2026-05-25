import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertyCard } from "../components/PropertyCard";
import { Icon } from "../components/Icon";
import { LoadingState, ErrorState } from "../components/PageState";
import { CityZoneSelect } from "../components/location/CityZoneSelect";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAuth } from "../context/AuthContext";
import {
  buildCategoryFilters,
  es,
  fetchCategories,
  fetchCompatQuiz,
  fetchProperties,
  fetchSearchPrefs,
  getDefaultZoneForCity,
  matchesCityZoneFilter,
  type Category,
  type MoonCitySlug,
  type Property,
} from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function DiscoverPage() {
  const { user } = useAuth();
  const { isListingSaved, toggleListing } = useBookmarks();
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filterCity, setFilterCity] = useState<MoonCitySlug | "">("");
  const [filterZone, setFilterZone] = useState("");
  const [appliedCity, setAppliedCity] = useState<MoonCitySlug | "">("");
  const [appliedZone, setAppliedZone] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [appliedBudget, setAppliedBudget] = useState("");
  const [moveInQ, setMoveInQ] = useState("");
  const [appliedMoveIn, setAppliedMoveIn] = useState("");
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function applyFilters(list: Property[]): Property[] {
    const max = parseInt(appliedBudget.replace(/\D/g, ""), 10);
    const moveIn = appliedMoveIn.trim();
    return list.filter((p) => {
      if (!matchesCityZoneFilter(p.city, p.location, appliedCity, appliedZone)) return false;
      if (!Number.isNaN(max) && max > 0 && p.price > max) return false;
      if (moveIn && p.availableFrom && p.availableFrom > moveIn) return false;
      return true;
    });
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchSearchPrefs(user.id)
      .then((prefs) => {
        if (prefs.city) {
          setFilterCity(prefs.city);
          setAppliedCity(prefs.city);
          const zone = prefs.zone ?? getDefaultZoneForCity(prefs.city);
          setFilterZone(zone);
          setAppliedZone(prefs.zone ?? "");
        }
        if (prefs.budgetMax) {
          const b = String(prefs.budgetMax);
          setBudgetMax(b);
          setAppliedBudget(b);
        }
        if (prefs.moveIn) {
          setMoveInQ(prefs.moveIn);
          setAppliedMoveIn(prefs.moveIn);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }

    fetchCategories()
      .then((cats) => setCategories(buildCategoryFilters(cats, es.discover.allCategories)))
      .catch((e) => {
        console.error("Error fetching categories:", e);
        setError(e instanceof Error ? e.message : es.common.errorLoad);
      });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError(null);

    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});
    quizPromise
      .then((quiz) => fetchProperties(activeCategory, quiz))
      .then((props) => {
        setAllProperties(props);
      })
      .catch((e) => {
        console.error("Error fetching properties:", e);
        setError(e instanceof Error ? e.message : es.common.errorLoad);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, user?.id]);

  useEffect(() => {
    setProperties(applyFilters(allProperties));
  }, [allProperties, appliedCity, appliedZone, appliedBudget, appliedMoveIn]);

  function runSearch() {
    setAppliedCity(filterCity);
    setAppliedZone(filterZone);
    setAppliedBudget(budgetMax.trim());
    setAppliedMoveIn(moveInQ.trim());
  }

  const handleBookmark = async (slug: string) => {
    if (!user) return;
    await toggleListing(slug);
  };

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-surface-container-lowest p-4 card-shadow">
          <CityZoneSelect
            city={filterCity}
            zone={filterZone}
            cityOptional
            zoneOptional
            onCityChange={setFilterCity}
            onZoneChange={setFilterZone}
          />
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-end md:gap-4">
            <div className="flex flex-1 items-center border-b border-border-light px-2 py-2 md:border-b-0 md:border-r md:px-4">
              <Icon name="payments" className="mr-3 text-warm-slate" />
              <div className="flex flex-col">
                <label className="text-label-sm uppercase tracking-wider text-warm-slate">
                  {es.discover.budget}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder={es.discover.budgetPlaceholder}
                  className="border-none bg-transparent p-0 font-semibold text-deep-navy placeholder:text-outline focus:ring-0"
                />
              </div>
            </div>
            <div className="flex flex-1 items-center px-2 py-2 md:px-4">
              <Icon name="calendar_month" className="mr-3 text-warm-slate" />
              <div className="flex flex-col">
                <label className="text-label-sm uppercase tracking-wider text-warm-slate">
                  {es.discover.moveIn}
                </label>
                <input
                  type="date"
                  value={moveInQ}
                  onChange={(e) => setMoveInQ(e.target.value)}
                  className="border-none bg-transparent p-0 font-semibold text-deep-navy placeholder:text-outline focus:ring-0"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-deep-navy px-8 py-3 text-label-md text-on-primary transition-all hover:opacity-90 md:w-auto"
            >
              <Icon name="search" className="text-[20px]" />
              {es.common.search}
            </button>
          </div>
        </div>
      </section>

      <div className="no-scrollbar mb-stack-lg flex gap-3 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.slug)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-5 py-2 text-label-md transition-colors ${
              activeCategory === cat.slug
                ? "bg-deep-navy text-white"
                : "border border-border-light bg-surface-container text-deep-navy hover:bg-surface-container-high"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState message={es.common.loading} />}
      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {properties.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border-light bg-surface-container-lowest p-12 text-center">
              <Icon name="home_work" className="mx-auto mb-4 text-5xl text-stone-300" />
              <h3 className="mb-2 text-headline-md text-deep-navy">
                No hay habitaciones disponibles en esta categoría
              </h3>
              <p className="mb-6 text-body-md text-warm-slate">
                Prueba a cambiar de categoría o ajusta tus filtros de búsqueda. También puedes explorar todos los alojamientos disponibles.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setActiveCategory("all")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white transition-opacity hover:opacity-90 active:opacity-70"
                >
                  <Icon name="refresh" />
                  Ver todas las categorías
                </button>
                <Link
                  to="/alojamientos"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-border-light px-6 py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container active:bg-surface-container-high"
                >
                  <Icon name="explore" />
                  Explorar todos los alojamientos
                </Link>
              </div>
            </div>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.slug}
                property={p}
                isSaved={user ? isListingSaved(p.slug) : false}
                onToggleBookmark={user ? handleBookmark : undefined}
              />
            ))
          )}
        </section>
      )}
    </main>
  );
}
