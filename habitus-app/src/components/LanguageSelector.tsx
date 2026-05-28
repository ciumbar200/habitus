import { useState, useEffect } from "react";
import { Globe } from "@phosphor-icons/react";
import { SUPPORTED_LANGUAGES, type LanguageCode, saveLanguage } from "../lib/i18n";
import { useLanguage } from "../lib/I18nContext";
import { LanguageFlag } from "./LanguageFlag";

/**
 * Spacest-style language selector
 * Shows in header with flags and language names
 * Changes language dynamically across the app
 */
export function LanguageSelector() {
  const { language: currentLang, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Apply language to HTML lang attribute
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  function handleLanguageChange(lang: LanguageCode) {
    if (changeLanguage) {
      changeLanguage(lang);
    } else {
      // Fallback if not in provider context
      saveLanguage(lang);
      // Reload page to apply new language
      window.location.reload();
    }
    setIsOpen(false);
  }

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Change language"
      >
        <Globe size={18} />
        <LanguageFlag code={current.code} className="hidden h-[14px] w-[21px] sm:inline-flex" />
        <span className="hidden md:inline">{current.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl bg-white py-2 shadow-xl border border-stone-200">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  lang.code === currentLang
                    ? "bg-stone-100 text-stone-900 font-medium"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <LanguageFlag code={lang.code} className="h-4 w-6" />
                <span>{lang.name}</span>
                {lang.code === currentLang && (
                  <svg className="ml-auto h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
