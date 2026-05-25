import { Link } from "react-router-dom";
import { es, formatPrice, type Lease } from "@habitus/core";

type LeaseCardProps = {
  lease: Lease;
};

export function LeaseCard({ lease }: LeaseCardProps) {
  const statusLabel =
    es.leases.status[lease.status as keyof typeof es.leases.status] ?? lease.status;

  return (
    <article className="rounded-xl border border-border-light bg-surface-container-lowest p-5 card-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-headline-md text-deep-navy">{lease.listingName ?? "Contrato"}</h3>
          <p className="mt-1 text-label-sm text-warm-slate">{statusLabel}</p>
          {lease.monthlyRent != null && (
            <p className="mt-2 text-body-sm text-deep-navy">
              {formatPrice(lease.monthlyRent, "EUR")}/mes
            </p>
          )}
        </div>
        {lease.listingSlug && (
          <Link
            to={`/property/${lease.listingSlug}`}
            className="text-label-md text-teal-accent hover:underline"
          >
            {es.leases.viewListing}
          </Link>
        )}
      </div>
    </article>
  );
}
