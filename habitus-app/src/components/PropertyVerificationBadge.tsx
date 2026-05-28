import type { PropertyVerificationStatus } from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type PropertyVerificationBadgeProps = {
  status: PropertyVerificationStatus;
  size?: "sm" | "md";
  className?: string;
};

const styles: Record<PropertyVerificationStatus, string> = {
  verified: "bg-teal-accent/15 text-teal-accent border-teal-accent/30",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  none: "bg-surface-container text-warm-slate border-border-light",
};

export function PropertyVerificationBadge({
  status,
  size = "md",
  className = "",
}: PropertyVerificationBadgeProps) {
  const t = useI18n();
  const pv = t.propertyVerification;
  const label =
    status === "verified"
      ? pv.verified
      : status === "pending"
        ? pv.pending
        : pv.notVerified;

  const icon =
    status === "verified" ? "home_work" : status === "pending" ? "hourglass_top" : "domain";

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
