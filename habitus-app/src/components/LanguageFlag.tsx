import type { LanguageCode } from "../lib/i18n";

type LanguageFlagProps = {
  code: LanguageCode;
  className?: string;
};

/** Senyera (Catalunya) — el emoji regional suele renderizarse en negro en muchos sistemas. */
function CatalanFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 27 18"
      className={className}
      aria-hidden
      role="presentation"
    >
      <rect width="27" height="2" y="0" fill="#FCDD09" />
      <rect width="27" height="2" y="2" fill="#DA121A" />
      <rect width="27" height="2" y="4" fill="#FCDD09" />
      <rect width="27" height="2" y="6" fill="#DA121A" />
      <rect width="27" height="2" y="8" fill="#FCDD09" />
      <rect width="27" height="2" y="10" fill="#DA121A" />
      <rect width="27" height="2" y="12" fill="#FCDD09" />
      <rect width="27" height="2" y="14" fill="#DA121A" />
      <rect width="27" height="2" y="16" fill="#FCDD09" />
    </svg>
  );
}

export function LanguageFlag({ code, className = "h-[14px] w-[21px] shrink-0 rounded-[2px] object-cover" }: LanguageFlagProps) {
  if (code === "ca") {
    return <CatalanFlag className={className} />;
  }
  const emoji = code === "en" ? "🇬🇧" : "🇪🇸";
  return (
    <span className="inline-flex shrink-0 items-center justify-center text-base leading-none" aria-hidden>
      {emoji}
    </span>
  );
}
