import type { ReactNode } from "react";

export const adminInputClass =
  "w-full rounded-xl border border-border-light bg-white px-3 py-2.5 text-body-sm text-deep-navy shadow-sm transition-colors placeholder:text-warm-slate/60 focus:border-teal-accent focus:outline-none focus:ring-2 focus:ring-teal-accent/20";

export const adminSelectClass =
  "w-full rounded-xl border border-border-light bg-white px-3 py-2.5 text-body-sm text-deep-navy shadow-sm focus:border-teal-accent focus:outline-none focus:ring-2 focus:ring-teal-accent/20";

export const adminTextareaClass = `${adminInputClass} min-h-[96px] resize-y`;

export const adminButtonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-deep-navy px-4 py-2.5 text-label-sm font-medium text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50";

export const adminButtonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border-light bg-white px-4 py-2.5 text-label-sm font-medium text-deep-navy shadow-sm transition-colors hover:bg-surface-container disabled:opacity-50";

type AdminFormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function AdminFormField({ label, hint, children, className = "" }: AdminFormFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-label-sm font-medium text-deep-navy">{label}</span>
      {children}
      {hint && <span className="text-label-sm text-warm-slate">{hint}</span>}
    </label>
  );
}
