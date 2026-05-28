/**
 * Multi-language translations for : moon shared living
 * Dynamic import system for web app
 */

import { es } from "./es";
import { en } from "./en";
import { ca } from "./ca";

// All available translations
export const translations = {
  es,
  en,
  ca,
} as const;

// Re-export types
export type I18n = typeof es;
export type LanguageCode = keyof typeof translations;

/**
 * Get translations for a specific language code
 * Falls back to Spanish if language not found
 */
export function getI18n(lang: LanguageCode): I18n {
  return (translations[lang] || translations.es) as I18n;
}

/**
 * Get all available language codes
 */
export function getAvailableLanguages(): LanguageCode[] {
  return Object.keys(translations) as LanguageCode[];
}

// Re-export individual translation objects
export { es, en, ca };
