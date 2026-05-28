import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { PublishListingModal } from "../../components/panel/PublishListingModal";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "@habitus/core";
import { listingStatusClass, listingStatusLabel } from "@habitus/core";
import { es } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import { fetchMyListings, deleteListing, type OwnerListing } from "@habitus/core";

export function MyListingsPage() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const role = profile?.accountRole;
  const copy = listingCopyForRole(role);

  useEffect(() => {
    if (!user?.id) return;
    fetchMyListings(user.id, profile?.accountRole ?? undefined)
      .then(setListings)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id, profile?.accountRole]);

  async function handleDeleteListing(listingId: string) {
    if (!user?.id || !window.confirm(es.panel.deleteListingConfirm)) return;
    setDeletingId(listingId);
    setError(null);
    const { error: err } = await deleteListing(user.id, listingId);
    setDeletingId(null);
    if (err) {
      setError(err);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <div className="mb-stack-lg flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-headline-lg text-deep-navy">{copy.myListings}</h1>
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white"
        >
          <Icon name="add" />
          {copy.newListing}
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && listings.length === 0 && (
        <div className="rounded-xl border border-border-light p-12 text-center card-shadow">
          <p className="mb-4 text-body-md text-warm-slate">{copy.noListings}</p>
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className="text-teal-accent hover:underline"
          >
            {copy.createFirst}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {listings.map((l) => (
          <article
            key={l.id}
            className="flex flex-col gap-4 rounded-xl border border-border-light bg-surface-container-lowest p-4 card-shadow md:flex-row md:items-center"
          >
            {l.coverImageUrl && (
              <img
                src={l.coverImageUrl}
                alt=""
                className="h-24 w-full rounded-lg object-cover md:h-20 md:w-32"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-headline-md text-deep-navy">{l.name}</h2>
                <span className={`rounded px-2 py-0.5 text-label-sm ${listingStatusClass(l.status)}`}>
                  {listingStatusLabel(l.status)}
                </span>
                {l.visibility === "private" && role !== "anfitrion" && (
                  <span className="rounded bg-deep-navy px-2 py-0.5 text-label-sm text-white">
                    {es.property.privateBadge}
                  </span>
                )}
              </div>
              <p className="text-body-md text-warm-slate">{l.location}</p>
              <p className="text-label-md text-teal-accent">
                {formatPrice(l.priceMonthly, l.currency)} / {es.common.perMonth}
              </p>
              {l.agencyClientName && (
                <p className="text-label-sm text-warm-slate">
                  Cliente u operador: {l.agencyClientName}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {l.status === "published" && (
                <Link
                  to={`/property/${l.slug}`}
                  className="rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
                >
                  {es.common.view}
                </Link>
              )}
              <Link
                to={`/panel/espacios/${l.id}/editar`}
                className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-white"
              >
                {es.common.edit}
              </Link>
              {l.visibility === "private" && role !== "anfitrion" && (
                <Link
                  to={`/panel/espacios/${l.id}/acceso`}
                  className="rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
                >
                  {es.groups.unlockTitle}
                </Link>
              )}
              <button
                type="button"
                disabled={deletingId === l.id}
                onClick={() => handleDeleteListing(l.id)}
                className="rounded-lg border border-error/40 px-4 py-2 text-label-sm text-error hover:bg-error-container/20 disabled:opacity-60"
              >
                {deletingId === l.id ? es.common.pleaseWait : es.common.delete}
              </button>
            </div>
          </article>
        ))}
      </div>

      <PublishListingModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={() => {
          if (user?.id) {
            fetchMyListings(user.id, profile?.accountRole ?? undefined).then(setListings).catch(() => {});
          }
        }}
      />
    </main>
  );
}
