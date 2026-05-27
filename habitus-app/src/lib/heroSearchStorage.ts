import {
  normalizeHeroSearchDraft,
  type HeroSearchDraft,
} from "@habitus/core";

const STORAGE_KEY = "habitus_hero_search";

export function loadHeroSearchDraft(): HeroSearchDraft | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeHeroSearchDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveHeroSearchDraft(draft: HeroSearchDraft): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeHeroSearchDraft(draft)));
}

export function clearHeroSearchDraft(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
