import type { ReactNode } from "react";
import { Icon } from "./Icon";

type PageStateProps = {
  message?: string;
};

export function LoadingState({ message = "Cargando…" }: PageStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-margin-mobile">
      <p className="text-body-md text-warm-slate">{message}</p>
    </div>
  );
}

export function ErrorState({
  message = "No se pudieron cargar los datos.",
  onRetry,
}: PageStateProps & { onRetry?: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-margin-mobile text-center">
      <Icon name="error" className="text-3xl text-error" />
      <p className="text-body-md text-error">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-teal-accent px-5 py-2 text-sm font-semibold text-white transition-opacity active:opacity-70"
        >
          <Icon name="refresh" size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = "info",
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description?: string;
  /** Acción opcional (botón, link, etc.) */
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-margin-mobile text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-warm-slate">
        <Icon name={icon} className="text-2xl" />
      </div>
      <p className="text-body-lg font-semibold text-on-surface">{title}</p>
      {description && (
        <p className="max-w-sm text-body-md text-warm-slate">{description}</p>
      )}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons — content-shaped placeholders for loading + Suspense     */
/* ------------------------------------------------------------------ */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-3 w-full rounded-full ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border-light bg-surface p-4">
      <div className="skeleton mb-3 h-24 w-full rounded-xl" />
      <SkeletonLine className="mb-2 w-2/3" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function SkeletonPage({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-margin-mobile py-6">
      <SkeletonLine className="h-6 w-1/2" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Slim app-shell skeleton para <Suspense fallback>. Rellena el área bajo el
 * Header al instante mientras carga el chunk de la ruta (solo shimmer, sin
 * parpadeo de texto). El header y el bottom-nav permanecen montados.
 */
export function RouteFallback() {
  return (
    <div className="px-margin-mobile pt-6" aria-hidden>
      <SkeletonLine className="mb-4 h-7 w-1/3 rounded-lg" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
