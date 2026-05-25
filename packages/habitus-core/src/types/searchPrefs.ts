import {
  formatMoonLocation,
  isMoonCitySlug,
  normalizeCitySlug,
  normalizeZoneSlug,
  type MoonCitySlug,
} from "../data/locations";

export type SearchCity = MoonCitySlug | "";

export type SearchPrefs = {
  city: SearchCity;
  zone: string | null;
  budgetMax: number | null;
  moveIn: string | null;
  roomType: string | null;
};

export const EMPTY_SEARCH_PREFS: SearchPrefs = {
  city: "",
  zone: null,
  budgetMax: null,
  moveIn: null,
  roomType: null,
};

export function normalizeSearchPrefs(raw: unknown): SearchPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SEARCH_PREFS };
  }
  const o = raw as Record<string, unknown>;
  const cityRaw = o.city;
  const city =
    cityRaw === "both"
      ? ""
      : typeof cityRaw === "string" && isMoonCitySlug(normalizeCitySlug(cityRaw))
        ? (normalizeCitySlug(cityRaw) as SearchCity)
        : "";
  const zoneRaw = o.zone;
  const zone =
    typeof zoneRaw === "string" && zoneRaw.trim()
      ? normalizeZoneSlug(city, zoneRaw)
      : null;
  const budget =
    typeof o.budgetMax === "number"
      ? o.budgetMax
      : typeof o.budgetMax === "string"
        ? parseInt(o.budgetMax.replace(/\D/g, ""), 10) || null
        : null;
  return {
    city,
    zone: city && zone ? zone : null,
    budgetMax: budget,
    moveIn: typeof o.moveIn === "string" ? o.moveIn : null,
    roomType: typeof o.roomType === "string" ? o.roomType : null,
  };
}

/** Texto legible para pre-rellenar búsqueda (zona · ciudad). */
export function searchPrefsDiscoverLocation(prefs: SearchPrefs): string {
  if (!prefs.city) return "";
  return formatMoonLocation(prefs.city, prefs.zone);
}
