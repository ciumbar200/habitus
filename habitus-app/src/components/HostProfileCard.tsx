import { Link } from "react-router-dom";
import type { PropertyHost } from "@habitus/core";
import { Icon } from "./Icon";
import { IdentityBadge } from "./IdentityBadge";
import { useI18n } from "../lib/I18nContext";

type HostProfileCardProps = {
  host: PropertyHost;
  compact?: boolean;
};

export function HostProfileCard({ host, compact = false }: HostProfileCardProps) {
  const t = useI18n();

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-light bg-surface-container-low p-3">
        <Link to={`/miembro/${host.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
          <img
            src={host.image}
            alt={host.name}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-label-md font-medium text-deep-navy">{host.name}</p>
            <p className="truncate text-label-sm text-warm-slate">
              {host.roleTitle ?? t.property.hostLabel}
            </p>
          </div>
        </Link>
        <Link
          to={`/miembro/${host.slug}`}
          aria-label={t.matches.viewProfile}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-light text-deep-navy transition-colors hover:bg-surface-container"
        >
          <Icon name="visibility" />
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <p className="mb-4 text-label-sm uppercase tracking-wider text-teal-accent">
        {t.property.yourHost}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link to={`/miembro/${host.slug}`} className="flex items-center gap-4">
          <img
            src={host.image}
            alt={host.name}
            className="h-20 w-20 rounded-full border border-border-light object-cover"
          />
          <div>
            <h3 className="text-headline-md text-deep-navy">{host.name}</h3>
            <p className="text-body-md text-warm-slate">{host.roleTitle ?? t.property.hostLabel}</p>
            <IdentityBadge status={host.identityStatus} size="sm" className="mt-2" />
          </div>
        </Link>
        <Link
          to={`/miembro/${host.slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-light px-5 py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container sm:ml-auto"
        >
          <Icon name="visibility" className="text-[20px]" />
          {t.matches.viewProfile}
        </Link>
      </div>
      <p className="mt-4 text-body-sm text-warm-slate">{t.property.hostHint}</p>
    </section>
  );
}
