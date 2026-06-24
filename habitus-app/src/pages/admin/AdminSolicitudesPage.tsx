import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminSetApplicationStatus,
  es,
  fetchAdminApplications,
  type AdminApplicationRow,
} from "@habitus/core";
import { AdminFilterField } from "../../components/admin/AdminToolbar";
import { ErrorState, LoadingState } from "../../components/PageState";
import { AdminAlert, AdminCount, AdminPageShell } from "../../components/admin/AdminPageShell";
import { Link } from "react-router-dom";

const STATUS_OPTIONS = [
  { value: "submitted",  label: "Enviada",    color: "bg-blue-50 text-blue-700" },
  { value: "reviewing",  label: "En revisión", color: "bg-amber-50 text-amber-700" },
  { value: "accepted",   label: "Aceptada",   color: "bg-teal-accent/10 text-teal-accent" },
  { value: "rejected",   label: "Rechazada",  color: "bg-error-container/30 text-error" },
  { value: "withdrawn",  label: "Retirada",   color: "bg-surface-container text-warm-slate" },
];

function statusColor(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "bg-surface-container text-warm-slate";
}
function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

const selectClass = "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[130px]";

export function AdminSolicitudesPage() {
  const [rows, setRows] = useState<AdminApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminApplications()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (sourceFilter === "curated" && row.source !== "admin_curated") return false;
      if (sourceFilter === "user" && row.source === "admin_curated") return false;
      if (!q) return true;
      return (
        row.profileName.toLowerCase().includes(q) ||
        row.listingName.toLowerCase().includes(q) ||
        (row.listingCity ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter, sourceFilter]);

  async function handleStatusChange(row: AdminApplicationRow, status: string) {
    if (busyId) return;
    setBusyId(row.id);
    const err = await adminSetApplicationStatus(row.id, status);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    setBusyId(null);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  const hasFilters = search || statusFilter || sourceFilter;

  return (
    <AdminPageShell title={es.admin.applicationsTitle} subtitle={es.admin.applicationsSubtitle}>
      {error && <AdminAlert message={error} />}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label="Buscar" className="min-w-[200px] flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Inquilino, espacio, ciudad…"
            className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm"
          />
        </AdminFilterField>
        <AdminFilterField label="Estado">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </AdminFilterField>
        <AdminFilterField label="Origen">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            <option value="user">Usuario</option>
            <option value="curated">Curado :moon</option>
          </select>
        </AdminFilterField>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter(""); setSourceFilter(""); }}
            className="rounded-lg border border-border-light px-3 py-2 text-label-sm hover:bg-surface-container"
          >
            {es.admin.filters.clear}
          </button>
        )}
      </div>

      <AdminCount current={filtered.length} total={rows.length} />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">{es.admin.filters.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[860px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="px-4 py-3 text-label-md text-deep-navy">Inquilino</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Espacio</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Ciudad</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Origen</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Fecha</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-light align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/usuarios/${row.profileId}`}
                      className="font-medium text-deep-navy hover:text-teal-accent hover:underline"
                    >
                      {row.profileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">{row.listingName}</td>
                  <td className="px-4 py-3 text-warm-slate">{row.listingCity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.source === "admin_curated" ? (
                      <span className="rounded-full bg-teal-accent/10 px-2 py-0.5 text-[11px] text-teal-accent">
                        :moon
                      </span>
                    ) : (
                      <span className="text-[11px] text-warm-slate">Usuario</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {new Date(row.appliedAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      disabled={busyId === row.id}
                      onChange={(e) => handleStatusChange(row, e.target.value)}
                      className="rounded-lg border border-border-light px-2 py-1 text-[11px] disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
