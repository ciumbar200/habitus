import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarBlank,
  Door,
  House,
  MagnifyingGlass,
  Users,
} from "@phosphor-icons/react";
import {
  buildPublicListingsUrl,
  categoryToAccommodation,
  EMPTY_HERO_SEARCH,
  fetchSearchPrefs,
  getDefaultZoneForCity,
  getZonesForCity,
  heroDraftFromSearchPrefs,
  MOON_CITIES,
  normalizeHeroSearchDraft,
  type HeroSearchDraft,
  type MoonCitySlug,
} from "@habitus/core";
import { useAuth } from "../../context/AuthContext";
import { accessSignupUrl } from "../../lib/accessLinks";
import { loadHeroSearchDraft, saveHeroSearchDraft } from "../../lib/heroSearchStorage";
import { useI18n } from "../../lib/I18nContext";
import { saveReturnTo } from "../../lib/returnTo";

function draftToFormState(draft: HeroSearchDraft) {
  const accommodation = categoryToAccommodation(draft.roomType);
  return {
    city: draft.city,
    zone: draft.zone ?? "",
    moveIn: draft.moveIn ?? "",
    stayMonths: draft.stayMonths ?? 7,
    accommodation,
    budgetMax: draft.budgetMax != null ? String(draft.budgetMax) : "",
  };
}

function formStateToDraft(state: ReturnType<typeof draftToFormState>): HeroSearchDraft {
  const budget = parseInt(state.budgetMax.replace(/\D/g, ""), 10);
  const roomType =
    state.accommodation === "habitacion"
      ? "habitacion"
      : state.accommodation === "piso-grupo"
        ? "piso-grupo"
        : null;
  return normalizeHeroSearchDraft({
    city: state.city,
    zone: state.zone || null,
    moveIn: state.moveIn || null,
    stayMonths: state.stayMonths,
    budgetMax: Number.isNaN(budget) || budget <= 0 ? null : budget,
    roomType,
  });
}

/** Formulario de búsqueda del hero estilo Spacest: compacto, una fila, prominent CTA. */
export function HeroSearchForm() {
  const t = useI18n();
  const hs = t.public.heroSearch;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(() => draftToFormState(EMPTY_HERO_SEARCH));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = loadHeroSearchDraft();
      if (stored) {
        if (!cancelled) setForm(draftToFormState(stored));
      }

      if (user?.id) {
        try {
          const prefs = await fetchSearchPrefs(user.id);
          const merged = heroDraftFromSearchPrefs(prefs);
          const withStored = stored
            ? normalizeHeroSearchDraft({ ...merged, ...stored, city: stored.city || merged.city })
            : merged;
          if (!cancelled) {
            setForm(draftToFormState(withStored));
            saveHeroSearchDraft(withStored);
          }
        } catch {
          /* perfil sin prefs */
        }
      }

      if (!cancelled) setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    saveHeroSearchDraft(formStateToDraft(form));
  }, [form, hydrated]);

  function handleCityChange(nextCity: MoonCitySlug | "") {
    setForm((prev) => ({
      ...prev,
      city: nextCity,
      zone: nextCity ? getDefaultZoneForCity(nextCity) : "",
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const draft = formStateToDraft(form);
    saveHeroSearchDraft(draft);
    const target = buildPublicListingsUrl(draft);

    if (user?.id) {
      navigate(target);
      return;
    }

    saveReturnTo(target);
    navigate(accessSignupUrl("inquilino"));
  }

  const zones = form.city ? getZonesForCity(form.city) : [];

  return (
    <form
      onSubmit={handleSubmit}
      className="relative min-w-0 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-2xl shadow-stone-950/40 ring-1 ring-white/30 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      {/* Spacest-style: Compact single row search */}
      <div className="flex flex-col gap-3">
        {/* Main search row - always visible */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          {/* City field */}
          <div className="relative flex-1 sm:min-w-[140px]">
            <div className="relative flex items-center rounded-xl bg-stone-100/80 px-3 py-2.5 transition-all focus-within:bg-stone-200/80 focus-within:ring-2 focus-within:ring-terracotta/20">
              <MagnifyingGlass size={16} className="absolute left-3 text-stone-400" aria-hidden />
              <select
                id="hero-city"
                value={form.city}
                onChange={(e) => handleCityChange(e.target.value as MoonCitySlug | "")}
                className="w-full appearance-none bg-transparent py-0 pl-7 pr-8 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
              >
                <option value="">{hs.cityPlaceholder}</option>
                {MOON_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zone field - shows when city selected */}
          {form.city && zones.length > 0 && (
            <div className="relative flex-1 sm:min-w-[140px]">
              <div className="flex items-center rounded-xl bg-stone-100/80 px-3 py-2.5 transition-all focus-within:bg-stone-200/80">
                <select
                  aria-label={hs.zoneLabel}
                  value={form.zone}
                  onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
                  className="w-full appearance-none bg-transparent py-0 text-sm font-medium text-stone-900 focus:outline-none focus:ring-0"
                >
                  <option value="">{hs.zonePlaceholder}</option>
                  {zones.map((z) => (
                    <option key={z.slug} value={z.slug}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date input */}
          <div className="relative flex-1 sm:min-w-[130px]">
            <div className="flex items-center rounded-xl bg-stone-100/80 px-3 py-2.5 transition-all focus-within:bg-stone-200/80">
              <CalendarBlank size={16} className="mr-2 text-stone-400 shrink-0" aria-hidden />
              <input
                type="date"
                value={form.moveIn}
                onChange={(e) => setForm((prev) => ({ ...prev, moveIn: e.target.value }))}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0 [color-scheme:light]"
              />
            </div>
          </div>

          {/* Budget input */}
          <div className="relative flex-1 sm:min-w-[100px]">
            <div className="flex items-center rounded-xl bg-stone-100/80 px-3 py-2.5 transition-all focus-within:bg-stone-200/80">
              <span className="mr-1 text-xs text-stone-400">€</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.budgetMax}
                onChange={(e) => setForm((prev) => ({ ...prev, budgetMax: e.target.value }))}
                placeholder={hs.budgetMaxPlaceholder}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
              />
              <span className="ml-1 text-xs text-stone-400">{hs.perMonthShort}</span>
            </div>
          </div>

          {/* Search button - Spacest style prominent */}
          <button
            type="submit"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-terracotta-dark hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 sm:min-w-[100px]"
          >
            <MagnifyingGlass size={16} weight="bold" />
            <span className="hidden sm:inline">{hs.search}</span>
          </button>
        </div>

        {/* Advanced options - accommodation type & stay months */}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Accommodation type toggle */}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="shrink-0 text-xs text-stone-500">{hs.type}</span>
            <div className="flex min-w-0 flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    accommodation: prev.accommodation === "piso-grupo" ? "" : "piso-grupo",
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  form.accommodation === "piso-grupo"
                    ? "bg-terracotta text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <House size={14} />
                {hs.entireHome}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    accommodation: prev.accommodation === "habitacion" ? "" : "habitacion",
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  form.accommodation === "habitacion"
                    ? "bg-terracotta text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Door size={14} />
                {hs.room}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    navigate("/descubrir");
                    return;
                  }
                  navigate(accessSignupUrl("inquilino"));
                }}
                className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-200"
              >
                <Users size={14} />
                {hs.formGroup}
              </button>
            </div>
          </div>

          {/* Stay duration - compact */}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <span className="text-xs text-stone-500">{hs.stay}</span>
            <div className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1">
              <input
                type="number"
                min={1}
                max={36}
                value={form.stayMonths}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    stayMonths: Math.min(36, Math.max(1, parseInt(e.target.value, 10) || 1)),
                  }))
                }
                className="w-10 border-0 bg-transparent p-0 text-center text-sm font-semibold text-stone-900 focus:outline-none focus:ring-0"
                aria-label={hs.stayMonthsLabel}
              />
              <span className="text-xs text-stone-500">{hs.months}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges - Spacest style */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 sm:mt-4">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {hs.verifiedSpaces}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {hs.noHiddenFees}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {hs.response24h}
        </span>
      </div>

    </form>
  );
}
