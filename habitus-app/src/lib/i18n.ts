/**
 * Multi-language infrastructure - Spacest style
 * Foundation for i18n across the app
 */

export const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸", rtl: false },
  { code: "en", name: "English", flag: "🇬🇧", rtl: false },
  { code: "ca", name: "Català", flag: "ca", rtl: false },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

/**
 * Default language (Spanish)
 */
export const DEFAULT_LANGUAGE: LanguageCode = "es";

/**
 * Get language from localStorage or browser
 */
export function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  // Check localStorage
  const stored = localStorage.getItem("moon-language");
  if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
    return stored as LanguageCode;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  const supported = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
  return supported?.code ?? DEFAULT_LANGUAGE;
}

/**
 * Save language preference
 */
export function saveLanguage(lang: LanguageCode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("moon-language", lang);
  }
}

/**
 * Format URL with language prefix (for future use)
 * Example: /en/alojamientos, /ca/alojamientos
 */
export function getLocalizedUrl(path: string, lang: LanguageCode): string {
  if (lang === DEFAULT_LANGUAGE) return path;
  return `/${lang}${path}`;
}

/**
 * Detect if language is RTL
 */
export function isRTL(lang: LanguageCode): boolean {
  const language = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return language?.rtl ?? false;
}
