export type SearchCity = "barcelona" | "madrid" | "both" | "";

export type SearchPrefs = {
  city: SearchCity;
  budgetMax: number | null;
  moveIn: string | null;
  roomType: string | null;
};

export const EMPTY_SEARCH_PREFS: SearchPrefs = {
  city: "",
  budgetMax: null,
  moveIn: null,
  roomType: null,
};

export function normalizeSearchPrefs(raw: unknown): SearchPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SEARCH_PREFS };
  }
  const o = raw as Record<string, unknown>;
  const city = o.city;
  const validCity =
    city === "barcelona" || city === "madrid" || city === "both" ? city : "";
  const budget =
    typeof o.budgetMax === "number"
      ? o.budgetMax
      : typeof o.budgetMax === "string"
        ? parseInt(o.budgetMax.replace(/\D/g, ""), 10) || null
        : null;
  return {
    city: validCity,
    budgetMax: budget,
    moveIn: typeof o.moveIn === "string" ? o.moveIn : null,
    roomType: typeof o.roomType === "string" ? o.roomType : null,
  };
}

export function searchPrefsDiscoverLocation(prefs: SearchPrefs): string {
  if (prefs.city === "barcelona") return "Barcelona";
  if (prefs.city === "madrid") return "Madrid";
  return "";
}
