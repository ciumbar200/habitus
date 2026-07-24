import type { IdentityStatus } from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type IdentityBadgeProps = {
  status: IdentityStatus;
  size?: "sm" | "md";
  className?: string;
};

const styles: Record<IdentityStatus, string> = {
  verified: "bg-teal-accent/15 text-teal-accent border-teal-accent/30",
  basic_trust: "bg-sky-100 text-sky-800 border-sky-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  none: "bg-surface-container text-warm-slate border-border-light",
};

export function IdentityBadge({ status, size = "md", className = "" }: IdentityBadgeProps) {
  const t = useI18n();
  const label =
    status === "verified"
      ? t.identity.verified
      : status === "basic_trust"
        ? t.identity.pending
      : status === "pending"
        ? t.identity.pending
        : t.identity.notVerified;

  const icon =
    status === "verified"
      ? "verified_user"
      : status === "pending"
        ? "hourglass_top"
        : "shield";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${styles[status]} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-label-sm"
      } ${className}`}
    >
      <Icon name={icon} className={size === "sm" ? "text-[14px]" : "text-[16px]"} />
      {label}
    </span>
  );
}
