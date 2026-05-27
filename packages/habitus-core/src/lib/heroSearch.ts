import type { MoonCitySlug } from "../data/locations";
import {
  EMPTY_SEARCH_PREFS,
  normalizeSearchPrefs,
  type SearchPrefs,
} from "../types/searchPrefs";

export type HeroAccommodation = "habitacion" | "piso-grupo" | "";

export type HeroSearchDraft = SearchPrefs & {
  stayMonths: number | null;
};

export const EMPTY_HERO_SEARCH: HeroSearchDraft = {
  ...EMPTY_SEARCH_PREFS,
  stayMonths: 7,
};

export function normalizeHeroSearchDraft(raw: unknown): HeroSearchDraft {
  const prefs = normalizeSearchPrefs(raw);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_HERO_SEARCH, ...prefs };
  }
  const o = raw as Record<string, unknown>;
  const stayRaw = o.stayMonths;
  const stayMonths =
    typeof stayRaw === "number" && stayRaw > 0
      ? Math.min(36, Math.round(stayRaw))
      : typeof stayRaw === "string"
        ? Math.min(36, parseInt(stayRaw.replace(/\D/g, ""), 10) || 7)
        : EMPTY_HERO_SEARCH.stayMonths;
  return { ...prefs, stayMonths };
}

export function heroDraftFromSearchPrefs(prefs: SearchPrefs): HeroSearchDraft {
  return normalizeHeroSearchDraft(prefs);
}

/** Convierte presupuesto máximo a banda de precio de /alojamientos. */
export function budgetMaxToPriceBand(max: number | null): string {
  if (max == null || max <= 0) return "";
  if (max <= 400) return "400";
  if (max <= 600) return "400-600";
  if (max <= 800) return "600-800";
  if (max <= 1000) return "800-1000";
  return "1000+";
}

export function accommodationToCategory(accommodation: HeroAccommodation): string {
  if (accommodation === "habitacion") return "habitacion";
  if (accommodation === "piso-grupo") return "piso-grupo";
  return "";
}

export function categoryToAccommodation(category: string | null | undefined): HeroAccommodation {
  if (category === "habitacion") return "habitacion";
  if (category === "piso-grupo") return "piso-grupo";
  return "";
}

export function buildPublicListingsUrl(draft: HeroSearchDraft): string {
  const params = new URLSearchParams();
  if (draft.city) params.set("ciudad", draft.city);
  if (draft.city && draft.zone) params.set("zona", draft.zone);
  const precio = budgetMaxToPriceBand(draft.budgetMax);
  if (precio) params.set("precio", precio);
  if (draft.roomType === "habitacion" || draft.roomType === "piso-grupo") {
    params.set("categoria", draft.roomType);
  }
  const q = params.toString();
  return q ? `/alojamientos?${q}` : "/alojamientos";
}

export function parseHeroSearchFromListingsUrl(
  searchParams: URLSearchParams,
): Partial<HeroSearchDraft> {
  const city = searchParams.get("ciudad") ?? "";
  const zone = searchParams.get("zona");
  const precio = searchParams.get("precio") ?? "";
  const categoria = searchParams.get("categoria") ?? "";
  let budgetMax: number | null = null;
  switch (precio) {
    case "400":
      budgetMax = 400;
      break;
    case "400-600":
      budgetMax = 600;
      break;
    case "600-800":
      budgetMax = 800;
      break;
    case "800-1000":
      budgetMax = 1000;
      break;
    case "1000+":
      budgetMax = 1200;
      break;
    default:
      break;
  }
  const roomType = categoria === "habitacion" || categoria === "piso-grupo" ? categoria : null;
  return normalizeHeroSearchDraft({
    city: city as MoonCitySlug | "",
    zone,
    budgetMax,
    roomType,
  });
}
