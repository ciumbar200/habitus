import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";
import {
  es,
  fetchListingAccess,
  fetchListingForEdit,
  fetchOwnerGroupsForGrant,
  grantListingAccessToGroup,
  revokeListingAccess,
  type ListingAccessGrant,
} from "@habitus/core";

export function ListingAccessPage() {
  const { id: listingId } = useParams();
  const { user } = useAuth();
  const [listingName, setListingName] = useState("");
  const [listingCity, setListingCity] = useState<string | null>(null);
  const [access, setAccess] = useState<ListingAccessGrant[]>([]);
  const [groups, setGroups] = useState<
    { id: string; name: string; slug: string; memberCount: number; targetMembers: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id || !listingId) return;
    setLoading(true);
    try {
      const listing = await fetchListingForEdit(user.id, listingId);
      if (!listing) {
        setError(es.property.notFound);
        return;
      }
      setListingName(listing.name);
      setListingCity(listing.city ?? null);
      const [grants, available] = await Promise.all([
        fetchListingAccess(listingId),
        fetchOwnerGroupsForGrant(user.id, listing.city).catch(() => []),
      ]);
      setAccess(grants);
      setGroups(available);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, listingId]);

  async function grant(groupId: string) {
    if (!user?.id || !listingId) return;
    setBusy(groupId);
    const err = await grantListingAccessToGroup(listingId, groupId, user.id);
    if (err) setError(err);
    else await load();
    setBusy(null);
  }

  async function revoke(accessId: string) {
    setBusy(accessId);
    const err = await revokeListingAccess(accessId);
    if (err) setError(err);
    else await load();
    setBusy(null);
  }

  if (loading) return <main className="mx-auto max-w-3xl px-margin-mobile pb-32 pt-24"><LoadingState /></main>;
  if (error && !listingName) return <main className="mx-auto max-w-3xl px-margin-mobile pb-32 pt-24"><ErrorState message={error} /></main>;

  const grantedIds = new Set(access.map((a) => a.groupId).filter(Boolean));

  return (
    <main className="mx-auto max-w-3xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <Link to="/panel/espacios" className="text-label-md text-teal-accent hover:underline">
        {es.common.back}
      </Link>
      <h1 className="mt-4 text-headline-lg text-deep-navy">{es.groups.unlockTitle}</h1>
      <p className="mt-2 text-body-md text-warm-slate">
        {listingName}
        {listingCity ? ` · ${listingCity}` : ""} — {es.groups.unlockHint}
      </p>
      {error && <p className="mt-4 text-body-sm text-error">{error}</p>}

      <section className="mt-8">
        <h2 className="text-headline-md text-deep-navy">{es.groups.accessGranted}</h2>
        {access.length === 0 ? (
          <p className="mt-2 text-body-md text-warm-slate">{es.groups.noAccess}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {access.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border-light p-4"
              >
                <div>
                  {a.groupName && (
                    <p className="text-label-md text-deep-navy">{a.groupName}</p>
                  )}
                  {a.profileName && <p className="text-label-md">{a.profileName}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy === a.id}
                  onClick={() => revoke(a.id)}
                  className="text-label-sm text-error hover:underline disabled:opacity-50"
                >
                  {es.common.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-headline-md text-deep-navy">{es.groups.grantAccess}</h2>
        {groups.length === 0 ? (
          <p className="mt-4 text-body-md text-warm-slate">
            {es.panel.noFormedGroups}{" "}
            <Link to="/panel/inquilinos" className="text-teal-accent hover:underline">
              {es.panel.ownerTenantsTitle}
            </Link>
          </p>
        ) : (
        <ul className="mt-4 space-y-2">
          {groups
            .filter((g) => !grantedIds.has(g.id))
            .map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-border-light p-4"
              >
                <div>
                  <p className="text-label-md text-deep-navy">{g.name}</p>
                  <p className="text-label-sm text-warm-slate">
                    {g.memberCount}/{g.targetMembers} {es.groups.members}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-teal-accent/10 px-2 py-0.5 text-label-sm text-teal-accent">
                    {es.groups.formedBadge}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy === g.id}
                  onClick={() => grant(g.id)}
                  className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-on-primary disabled:opacity-60"
                >
                  {busy === g.id ? es.common.pleaseWait : es.groups.grantAccess}
                </button>
              </li>
            ))}
        </ul>
        )}
      </section>
    </main>
  );
}
