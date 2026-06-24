import type { ReactNode } from "react";
import { es } from "@habitus/core";
import { AdminFormField, adminSelectClass } from "./AdminFormField";

export { adminSelectClass };

type AdminBulkBarProps = {
  selectedCount: number;
  filteredCount: number;
  allSelected: boolean;
  busy: boolean;
  onToggleAll: () => void;
  onDeselectAll: () => void;
  actions: { label: string; onClick: () => void; variant?: "primary" | "default" }[];
};

export function AdminBulkBar({
  selectedCount,
  filteredCount,
  allSelected,
  busy,
  onToggleAll,
  onDeselectAll,
  actions,
}: AdminBulkBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border-light bg-surface-container px-4 py-3 shadow-sm">
      <button
        type="button"
        disabled={busy || filteredCount === 0}
        onClick={allSelected ? onDeselectAll : onToggleAll}
        className="rounded-lg border border-border-light bg-white px-3 py-1.5 text-label-sm transition-colors hover:bg-surface-container disabled:opacity-50"
      >
        {allSelected ? es.admin.bulk.deselectAll : es.admin.bulk.selectAll}
      </button>
      {selectedCount > 0 && (
        <>
          <span className="text-label-sm text-warm-slate">
            {selectedCount} {es.admin.bulk.selected}
          </span>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={action.onClick}
              className={`rounded-lg px-3 py-1.5 text-label-sm font-medium transition-colors disabled:opacity-50 ${
                action.variant === "primary"
                  ? "bg-deep-navy text-on-primary shadow-sm hover:opacity-90"
                  : "border border-border-light bg-white hover:bg-surface-container"
              }`}
            >
              {action.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

type AdminFilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminFilterField({ label, children, className = "" }: AdminFilterFieldProps) {
  return (
    <AdminFormField label={label} className={className}>
      {children}
    </AdminFormField>
  );
}
