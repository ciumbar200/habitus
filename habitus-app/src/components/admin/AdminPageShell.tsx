import type { ReactNode } from "react";
import { Icon } from "../Icon";

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ title, subtitle, actions, children }: AdminPageShellProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border-light pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-headline-lg text-deep-navy">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-body-md text-warm-slate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  onClick?: () => void;
};

export function AdminStatCard({ label, value, icon, trend, onClick }: AdminStatCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl border border-border-light bg-surface-container-lowest p-5 text-left shadow-sm transition-all ${
        onClick ? "hover:border-teal-accent/30 hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label-sm font-medium text-warm-slate">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-accent/10 text-teal-accent">
            <Icon name={icon} className="text-[20px]" />
          </span>
        )}
      </div>
      <p className="mt-3 text-display-sm text-deep-navy">{value}</p>
      {trend && <p className="mt-1 text-label-sm text-warm-slate">{trend}</p>}
    </Tag>
  );
}

type AdminSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminSection({ title, description, actions, children, className = "" }: AdminSectionProps) {
  return (
    <section className={`rounded-2xl border border-border-light bg-surface-container-lowest shadow-sm ${className}`}>
      <div className="flex flex-col gap-2 border-b border-border-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-headline-sm text-deep-navy">{title}</h2>
          {description && <p className="mt-0.5 text-body-sm text-warm-slate">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminAlert({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "success" | "warning";
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <p className={`rounded-xl border px-4 py-3 text-body-sm ${styles[variant]}`}>{message}</p>
  );
}

export function AdminCount({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-label-sm text-warm-slate">
      {current} / {total}
    </p>
  );
}
