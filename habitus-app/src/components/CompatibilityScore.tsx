import { useState, type MouseEvent } from "react";
import type { CompatibilityResult } from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type CompatibilityScoreProps = {
  score: number | null | undefined;
  result?: CompatibilityResult;
  label?: string;
  /** En ficha de espacio: desglose visible por defecto */
  defaultOpen?: boolean;
  variant?: "default" | "gradient";
  className?: string;
  stopPropagation?: boolean;
};

export function CompatibilityScore({
  score,
  result,
  label,
  defaultOpen = false,
  variant = "default",
  className = "",
  stopPropagation = false,
}: CompatibilityScoreProps) {
  const t = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const canExpand = Boolean(result?.dimensions?.length);
  const display = score != null ? `${score}%` : "—";

  const toggle = (e: MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (canExpand) setOpen((v) => !v);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={!canExpand}
        aria-expanded={open}
        aria-label={canExpand ? t.compat.tapForBreakdown : undefined}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-bold backdrop-blur-md transition-opacity ${
          canExpand ? "cursor-pointer hover:opacity-90" : "cursor-default"
        } ${
          variant === "gradient"
            ? "vibe-match-gradient text-white"
            : defaultOpen
              ? "bg-surface-container text-teal-accent"
              : "bg-surface/90 text-teal-accent"
        }`}
      >
        <Icon name="bolt" className="text-[14px]" filled />
        <span>
          {display}
          {label ? ` ${label}` : ""}
        </span>
        {canExpand && (
          <Icon
            name={open ? "expand_less" : "expand_more"}
            className="text-[16px] opacity-80"
          />
        )}
      </button>

      {canExpand && open && result && (
        <CompatibilityBreakdownPanel result={result} className="mt-3" />
      )}

      {canExpand && !open && !defaultOpen && (
        <p
          className={`mt-1 text-[10px] ${variant === "gradient" ? "text-white/85" : "text-warm-slate"}`}
        >
          {t.compat.tapForBreakdown}
        </p>
      )}
      {score != null && !canExpand && (
        <p
          className={`mt-1 text-[10px] ${variant === "gradient" ? "text-white/85" : "text-warm-slate"}`}
        >
          {t.compat.quizRequiredInquilino}
        </p>
      )}
    </div>
  );
}

export function CompatibilityBreakdownPanel({
  result,
  className = "",
}: {
  result: CompatibilityResult;
  className?: string;
}) {
  const t = useI18n();
  return (
    <div
      className={`rounded-xl border border-border-light bg-surface p-4 text-left card-shadow ${className}`}
      role="region"
      aria-label={t.compat.breakdownTitle}
    >
      <p className="mb-3 text-label-md font-semibold text-deep-navy">{t.compat.breakdownTitle}</p>
      {result.summary ? (
        <p className="mb-4 text-body-sm text-warm-slate">{result.summary}</p>
      ) : null}
      <ul className="space-y-3">
        {result.dimensions.map((d) => (
          <li key={d.key}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-label-sm text-deep-navy">{d.label}</span>
              <span className="text-label-sm font-semibold text-teal-accent">{d.score}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-teal-accent transition-all"
                style={{ width: `${Math.min(100, Math.max(0, d.score))}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-warm-slate">{d.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
