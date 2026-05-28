import type { CompatibilityMode } from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type CompatibilityNoticeProps = {
  mode: CompatibilityMode;
  className?: string;
};

export function CompatibilityNotice({ mode, className = "" }: CompatibilityNoticeProps) {
  const t = useI18n();
  if (mode === "host") return null;

  const text =
    mode === "owner_only" ? t.property.compatOwnerOnly : t.property.compatNone;

  return (
    <div
      className={`flex gap-3 rounded-xl border border-border-light bg-surface-container px-4 py-3 ${className}`}
    >
      <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-teal-accent" />
      <p className="text-body-sm text-warm-slate">{text}</p>
    </div>
  );
}
