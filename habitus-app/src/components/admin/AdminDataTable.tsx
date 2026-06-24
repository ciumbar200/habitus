import type { ReactNode } from "react";

type AdminDataTableProps = {
  children: ReactNode;
  minWidth?: string;
  empty?: boolean;
  emptyMessage?: string;
};

export function AdminDataTable({
  children,
  minWidth = "640px",
  empty,
  emptyMessage = "No hay datos para mostrar.",
}: AdminDataTableProps) {
  if (empty) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-container/50 px-6 py-12 text-center">
        <p className="text-body-sm text-warm-slate">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border-light bg-surface-container/80">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTableTh({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-label-sm font-semibold uppercase tracking-wide text-warm-slate ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-light">{children}</tbody>;
}

export function AdminTableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-surface-container/40 ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function AdminTableTd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-body-sm text-deep-navy ${className}`}>{children}</td>;
}

export function AdminBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const variants = {
    default: "bg-surface-container text-warm-slate",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
