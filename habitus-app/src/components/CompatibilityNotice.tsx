import { es } from "@habitus/core";
import type { CompatibilityMode } from "@habitus/core";
import { Icon } from "./Icon";

type CompatibilityNoticeProps = {
  mode: CompatibilityMode;
  className?: string;
};

export function CompatibilityNotice({ mode, className = "" }: CompatibilityNoticeProps) {
  if (mode === "host") return null;

  const text =
    mode === "owner_only" ? es.property.compatOwnerOnly : es.property.compatNone;

  return (
    <div
      className={`flex gap-3 rounded-xl border border-border-light bg-surface-container px-4 py-3 ${className}`}
    >
      <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-teal-accent" />
      <p className="text-body-sm text-warm-slate">{text}</p>
    </div>
  );
}
