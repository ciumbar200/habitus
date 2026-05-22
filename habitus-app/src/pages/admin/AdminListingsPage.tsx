import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminAssignListingHost,
  adminBulkSetListingStatus,
  adminBulkSetPropertyVerification,
  adminSetPropertyVerification,
  es,
  fetchAdminHosts,
  fetchAdminListings,
  formatPrice,
  listingStatusLabel,
  setListingStatus,
  type AdminListingRow,
  type PropertyVerificationStatus,
} from "@habitus/core";
import { AdminBulkBar, AdminFilterField } from "../../components/admin/AdminToolbar";
import { PropertyVerificationBadge } from "../../components/PropertyVerificationBadge";
import { LoadingState, ErrorState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";

const selectClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[120px]";
const inputClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm w-full min-w-[200px]";

export function AdminListingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminListingRow[]>([]);
  const [hosts, setHosts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [hostPick, setHostPick] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchAdminListings(), fetchAdminHosts()])
      .then(([listings, hostList]) => {
        setRows(listings);
        setHosts(hostList);
        const picks: Record<string, string> = {};
        for (const row of listings) {
          if (row.hostProfileId) picks[row.id] = row.hostProfileId;
        }
        setHostPick(picks);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cities = useMemo(
    () =>
      [...new Set(rows.map((r) => r.city).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (city && row.city !== city) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (categoryFilter && row.categorySlug !== categoryFilter) return false;
      if (verificationFilter && row.propertyVerificationStatus !== verificationFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.city?.toLowerCase().includes(q) ?? false) ||
        (row.ownerName?.toLowerCase().includes(q) ?? false) ||
        (row.hostName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, city, statusFilter, categoryFilter, verificationFilter]);

  const filteredIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const selectedInView = useMemo(
    () => [...selected].filter((id) => filteredIds.has(id)),
    [selected, filteredIds],
  );
  const allFilteredSelected =
    filtered.length > 0 && selectedInView.length === filtered.length;

  function clearFilters() {
    setSearch("");
    setCity("");
    setStatusFilter("");
    setCategoryFilter("");
    setVerificationFilter("");
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of filtered) next.add(row.id);
      return next;
    });
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function updateStatus(id: string, status: "draft" | "published" | "archived") {
    setBusyId(id);
    const err = await setListingStatus(id, status);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setBusyId(null);
  }

  async function saveHost(row: AdminListingRow) {
    if (!user?.id) return;
    setBusyId(row.id);
    setError(null);
    const hostId = hostPick[row.id] || null;
    const err = await adminAssignListingHost(row.id, hostId, user.id);
    if (err) {
      setError(err);
    } else {
      const host = hosts.find((h) => h.id === hostId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, hostProfileId: hostId, hostName: host?.name ?? null }
            : r,
        ),
      );
    }
    setBusyId(null);
  }

  async function clearHost(row: AdminListingRow) {
    if (!user?.id) return;
    setBusyId(row.id);
    setError(null);
    const err = await adminAssignListingHost(row.id, null, user.id);
    if (err) setError(err);
    else {
      setHostPick((p) => ({ ...p, [row.id]: "" }));
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, hostProfileId: null, hostName: null } : r,
        ),
      );
    }
    setBusyId(null);
  }

  async function setPropertyVerification(row: AdminListingRow, status: PropertyVerificationStatus) {
    setBusyId(row.id);
    setError(null);
    const err = await adminSetPropertyVerification(row.id, status);
    if (err) setError(err);
    else
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, propertyVerificationStatus: status } : r)),
      );
    setBusyId(null);
  }

  async function runBulk(
    action: () => Promise<string | null>,
    patch: (ids: string[]) => Partial<AdminListingRow> | null,
  ) {
    const ids = selectedInView;
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    const err = await action();
    if (err) {
      setError(err);
    } else {
      const patchFields = patch(ids);
      if (patchFields) {
        const idSet = new Set(ids);
        setRows((prev) => prev.map((r) => (idSet.has(r.id) ? { ...r, ...patchFields } : r)));
      }
      setSelected(new Set());
    }
    setBulkBusy(false);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  const tl = es.admin.tableListings;
  const f = es.admin.filters;
  const hasFilters = search || city || statusFilter || categoryFilter || verificationFilter;

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.listingsTitle}</h1>
      <p className="mt-2 max-w-3xl text-body-lg text-warm-slate">{es.admin.listingsSubtitle}</p>
      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label={f.searchListings} className="min-w-[220px] flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={f.searchListings}
            className={inputClass}
          />
        </AdminFilterField>
        <AdminFilterField label={f.city}>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
            <option value="">{f.allCities}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </AdminFilterField>
        <AdminFilterField label={f.status}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allStatuses}</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </AdminFilterField>
        <AdminFilterField label={f.category}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allCategories}</option>
            <option value="piso-grupo">Piso</option>
            <option value="habitacion">Habitación</option>
          </select>
        </AdminFilterField>
        <AdminFilterField label={f.verification}>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allVerification}</option>
            <option value="none">{es.propertyVerification.notVerified}</option>
            <option value="pending">{es.propertyVerification.pending}</option>
            <option value="verified">{es.propertyVerification.verified}</option>
          </select>
        </AdminFilterField>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-border-light px-3 py-2 text-label-sm hover:bg-surface-container"
          >
            {f.clear}
          </button>
        )}
      </div>

      <p className="mt-3 text-label-sm text-warm-slate">
        {filtered.length} / {rows.length}
      </p>

      <AdminBulkBar
        selectedCount={selectedInView.length}
        filteredCount={filtered.length}
        allSelected={allFilteredSelected}
        busy={bulkBusy}
        onToggleAll={toggleAllFiltered}
        onDeselectAll={deselectAll}
        actions={[
          {
            label: es.admin.bulk.publish,
            variant: "primary",
            onClick: () =>
              runBulk(
                () => adminBulkSetListingStatus(selectedInView, "published"),
                () => ({ status: "published" }),
              ),
          },
          {
            label: es.admin.bulk.archive,
            onClick: () =>
              runBulk(
                () => adminBulkSetListingStatus(selectedInView, "archived"),
                () => ({ status: "archived" }),
              ),
          },
          {
            label: es.admin.bulk.verifyProperty,
            onClick: () =>
              runBulk(
                () => adminBulkSetPropertyVerification(selectedInView, "verified"),
                () => ({ propertyVerificationStatus: "verified" as PropertyVerificationStatus }),
              ),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">{f.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[1150px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="px-4 py-3 text-label-md text-deep-navy">Espacio</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{tl.category}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{tl.owner}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{tl.host}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{tl.propertyVerification}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{tl.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-light align-top last:border-0">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="h-4 w-4 rounded border-border-light"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/property/${row.slug}`}
                      className="font-medium text-teal-accent hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="text-label-sm text-warm-slate">
                      {row.city ?? "—"} · {formatPrice(row.priceMonthly, "EUR")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {row.categorySlug === "piso-grupo"
                      ? "Piso"
                      : row.categorySlug === "habitacion"
                        ? "Habitación"
                        : (row.categorySlug ?? "—")}
                  </td>
                  <td className="px-4 py-3 text-warm-slate">{row.ownerName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.canAssignHost ? (
                      <div className="flex min-w-[200px] flex-col gap-2">
                        <select
                          value={hostPick[row.id] ?? row.hostProfileId ?? ""}
                          onChange={(e) =>
                            setHostPick((p) => ({ ...p, [row.id]: e.target.value }))
                          }
                          className="rounded-lg border border-border-light bg-white px-2 py-1.5 text-label-sm"
                        >
                          <option value="">{es.admin.noHost}</option>
                          {hosts.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={busyId === row.id || bulkBusy}
                            onClick={() => saveHost(row)}
                            className="rounded-lg bg-teal-accent px-2 py-1 text-label-sm text-on-primary disabled:opacity-50"
                          >
                            {es.admin.assignHost}
                          </button>
                          {row.hostProfileId && (
                            <button
                              type="button"
                              disabled={busyId === row.id || bulkBusy}
                              onClick={() => clearHost(row)}
                              className="rounded-lg border border-border-light px-2 py-1 text-label-sm hover:bg-surface-container disabled:opacity-50"
                            >
                              {es.admin.removeHost}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-warm-slate">{row.hostName ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PropertyVerificationBadge status={row.propertyVerificationStatus} size="sm" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {row.propertyVerificationStatus !== "verified" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => setPropertyVerification(row, "verified")}
                          className="rounded-lg border border-teal-accent px-2 py-0.5 text-[11px] text-teal-accent disabled:opacity-50"
                        >
                          {es.admin.verifyProperty}
                        </button>
                      )}
                      {row.propertyVerificationStatus !== "none" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => setPropertyVerification(row, "none")}
                          className="rounded-lg border border-border-light px-2 py-0.5 text-[11px] text-warm-slate disabled:opacity-50"
                        >
                          {es.admin.revokeProperty}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {listingStatusLabel(row.status as "draft" | "published" | "archived")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status !== "published" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => updateStatus(row.id, "published")}
                          className="rounded-lg bg-deep-navy px-3 py-1 text-label-sm text-on-primary disabled:opacity-50"
                        >
                          Publicar
                        </button>
                      )}
                      {row.status !== "archived" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => updateStatus(row.id, "archived")}
                          className="rounded-lg border border-border-light px-3 py-1 text-label-sm hover:bg-surface-container disabled:opacity-50"
                        >
                          {es.admin.archive}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
