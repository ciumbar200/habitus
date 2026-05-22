import { useEffect, useState } from "react";
import { PropertyCard } from "../components/PropertyCard";
import { Icon } from "../components/Icon";
import { LoadingState, ErrorState } from "../components/PageState";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAuth } from "../context/AuthContext";
import { buildCategoryFilters, es, fetchCategories, fetchCompatQuiz, fetchProperties, fetchSearchPrefs, searchPrefsDiscoverLocation } from "@habitus/core";
import type { Category, Property } from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function DiscoverPage() {
  const { user } = useAuth();
  const { isListingSaved, toggleListing } = useBookmarks();
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [locationQ, setLocationQ] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedBudget, setAppliedBudget] = useState("");
  const [moveInQ, setMoveInQ] = useState("");
  const [appliedMoveIn, setAppliedMoveIn] = useState("");
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function applyFilters(list: Property[]): Property[] {
    const loc = appliedLocation.trim().toLowerCase();
    const max = parseInt(appliedBudget.replace(/\D/g, ""), 10);
    const moveIn = appliedMoveIn.trim();
    return list.filter((p) => {
      if (loc) {
        const hay = `${p.location} ${p.city}`.toLowerCase();
        if (!hay.includes(loc)) return false;
      }
      if (!Number.isNaN(max) && max > 0 && p.price > max) return false;
      if (moveIn && p.availableFrom && p.availableFrom > moveIn) return false;
      return true;
    });
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchSearchPrefs(user.id)
      .then((prefs) => {
        const loc = searchPrefsDiscoverLocation(prefs);
        if (loc) {
          setLocationQ(loc);
          setAppliedLocation(loc);
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
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError(null);
    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});
    quizPromise
      .then((quiz) => fetchProperties(activeCategory, quiz))
      .then(setAllProperties)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [activeCategory, user?.id]);

  useEffect(() => {
    setProperties(applyFilters(allProperties));
  }, [allProperties, appliedLocation, appliedBudget, appliedMoveIn]);

  function runSearch() {
    setAppliedLocation(locationQ.trim());
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
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-light bg-surface-container-lowest p-2 card-shadow md:flex-row md:gap-4 md:p-3">
          <div className="flex w-full flex-1 items-center border-b border-border-light px-4 py-2 md:border-b-0 md:border-r">
            <Icon name="location_on" className="mr-3 text-warm-slate" />
            <div className="flex flex-col">
              <label className="text-label-sm uppercase tracking-wider text-warm-slate">
                {es.discover.location}
              </label>
              <input
                type="text"
                value={locationQ}
                onChange={(e) => setLocationQ(e.target.value)}
                placeholder={es.discover.locationPlaceholder}
                className="border-none bg-transparent p-0 font-semibold text-deep-navy placeholder:text-outline focus:ring-0"
              />
            </div>
          </div>
          <div className="flex w-full flex-1 items-center border-b border-border-light px-4 py-2 md:border-b-0 md:border-r">
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
          <div className="flex w-full flex-1 items-center px-4 py-2">
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
            <p className="col-span-full text-center text-body-md text-warm-slate">
              {es.discover.emptyCategory}
            </p>
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
