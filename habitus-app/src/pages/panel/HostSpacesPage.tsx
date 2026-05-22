import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "@habitus/core";
import { listingStatusClass, listingStatusLabel } from "@habitus/core";
import { es } from "@habitus/core";
import { fetchHostListings } from "@habitus/core";
import type { OwnerListing } from "@habitus/core";

export function HostSpacesPage() {
  const { user, profileReady } = useAuth();
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileReady) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchHostListings(user.id)
      .then(setListings)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id, profileReady]);

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="mb-stack-lg text-headline-lg text-deep-navy">{es.panel.hostSpaces}</h1>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && listings.length === 0 && (
        <p className="text-body-md text-warm-slate">{es.panel.noHostSpaces}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {listings.map((l) => (
          <article
            key={l.id}
            className="rounded-xl border border-border-light bg-surface-container-lowest p-5 card-shadow"
          >
            <div className="mb-2 flex justify-between gap-2">
              <h2 className="text-headline-md text-deep-navy">{l.name}</h2>
              <span className={`rounded px-2 py-0.5 text-label-sm ${listingStatusClass(l.status)}`}>
                {listingStatusLabel(l.status)}
              </span>
            </div>
            <p className="text-body-md text-warm-slate">{l.location}</p>
            <p className="mt-2 text-label-md text-teal-accent">
              {formatPrice(l.priceMonthly, l.currency)} / {es.common.perMonth}
            </p>
            <Link
              to="/panel/solicitudes"
              className="mt-4 inline-block text-label-sm text-teal-accent hover:underline"
            >
              {es.panel.applications}
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
