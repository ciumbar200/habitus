import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { persistPendingReferral } from "@habitus/core";
import { accessSignupUrl } from "../../lib/accessLinks";
import { useI18n } from "../../lib/I18nContext";

/** Enlace discreto para introducir código de referencia antes del registro. */
export function HeroReferralHint() {
  const t = useI18n();
  const copy = t.public.heroReferral;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toLowerCase();
    if (!normalized) return;
    persistPendingReferral(normalized);
    navigate(accessSignupUrl("inquilino"));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-stone-400 underline-offset-2 transition-colors hover:text-stone-600 hover:underline"
      >
        {copy.open}
      </button>
    );
  }

  return (
    <form onSubmit={handleContinue} className="mx-auto flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={copy.placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="shrink-0 rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t.access.continue}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setCode("");
        }}
        className="text-xs text-stone-400 hover:text-stone-600 sm:sr-only"
      >
        {t.common.cancel}
      </button>
    </form>
  );
}
