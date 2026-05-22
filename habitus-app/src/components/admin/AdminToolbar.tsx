import type { ReactNode } from "react";
import { es } from "@habitus/core";

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
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border-light bg-surface-container px-4 py-3">
      <button
        type="button"
        disabled={busy || filteredCount === 0}
        onClick={allSelected ? onDeselectAll : onToggleAll}
        className="rounded-lg border border-border-light px-3 py-1.5 text-label-sm hover:bg-white disabled:opacity-50"
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
              className={`rounded-lg px-3 py-1.5 text-label-sm disabled:opacity-50 ${
                action.variant === "primary"
                  ? "bg-deep-navy text-on-primary"
                  : "border border-border-light hover:bg-white"
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
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-label-sm text-warm-slate">{label}</span>
      {children}
    </label>
  );
}
