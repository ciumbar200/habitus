/**
 * I18n Context
 *
 * Single source of truth for language context
 */

import * as React from "react";
import { getI18n, type I18n } from "@habitus/core";
import { getInitialLanguage, saveLanguage, type LanguageCode } from "./i18n";

interface I18nContextValue {
  language: LanguageCode;
  t: I18n;
  changeLanguage: (lang: LanguageCode) => void;
}

export const I18nContext = React.createContext<I18nContextValue>({
  language: getInitialLanguage(),
  t: getI18n(getInitialLanguage()),
  changeLanguage: () => {},
});

interface Props {
  children: React.ReactNode;
}

export function I18nProvider({ children }: Props) {
  const [language, setLanguage] = React.useState<LanguageCode>(getInitialLanguage);

  // Load saved language on mount
  React.useEffect(() => {
    const saved = getInitialLanguage();
    setLanguage(saved);
  }, []);

  // Update translations when language changes
  const t = React.useMemo(() => getI18n(language), [language]);

  // Provide change language function
  const changeLanguage = React.useCallback((newLang: LanguageCode) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      language,
      t,
      changeLanguage,
    }),
    [language, t, changeLanguage]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to get current translations
 * Usage: const t = useI18n();
 * Then: t.common.signIn, t.nav.discover, etc.
 */
export function useI18n(): I18n {
  const context = React.useContext(I18nContext);
  if (!context) {
    // Fallback if used outside provider
    const language = getInitialLanguage();
    return getI18n(language);
  }
  return context.t;
}

/**
 * Hook to get both language and translations
 */
export function useLanguage(): {
  language: LanguageCode;
  t: I18n;
  changeLanguage: (lang: LanguageCode) => void;
} {
  const context = React.useContext(I18nContext);
  if (!context) {
    const language = getInitialLanguage();
    return {
      language,
      t: getI18n(language),
      changeLanguage: (lang: LanguageCode) => {
        saveLanguage(lang);
        window.location.reload();
      },
    };
  }
  return context;
}
