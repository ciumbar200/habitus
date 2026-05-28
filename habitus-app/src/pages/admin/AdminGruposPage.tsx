import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminSetGroupStatus,
  es,
  fetchAdminGroups,
  type AdminGroupRow,
} from "@habitus/core";
import { AdminFilterField } from "../../components/admin/AdminToolbar";
import { ErrorState, LoadingState } from "../../components/PageState";

const STATUS_OPTIONS = [
  { value: "active",    label: "Activo",    color: "bg-teal-accent/10 text-teal-accent" },
  { value: "forming",   label: "Formándose", color: "bg-blue-50 text-blue-700" },
  { value: "archived",  label: "Archivado",  color: "bg-surface-container text-warm-slate" },
  { value: "dissolved", label: "Disuelto",  color: "bg-error-container/30 text-error" },
];

function statusColor(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "bg-surface-container text-warm-slate";
}
function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

const selectClass = "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[130px]";

export function AdminGruposPage() {
  const [rows, setRows] = useState<AdminGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminGroups()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.city ?? "").toLowerCase().includes(q) ||
        row.creatorName.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  async function handleStatusChange(row: AdminGroupRow, status: string) {
    if (busyId) return;
    setBusyId(row.id);
    const err = await adminSetGroupStatus(row.id, status);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    setBusyId(null);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.groupsTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.groupsSubtitle}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label="Buscar" className="min-w-[200px] flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, ciudad, creador…"
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
        {(search || statusFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter(""); }}
            className="rounded-lg border border-border-light px-3 py-2 text-label-sm hover:bg-surface-container"
          >
            {es.admin.filters.clear}
          </button>
        )}
      </div>

      <p className="mt-3 text-label-sm text-warm-slate">{filtered.length} / {rows.length}</p>

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">{es.admin.filters.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[760px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="px-4 py-3 text-label-md text-deep-navy">Nombre</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Ciudad</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Creador</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Miembros</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Fecha</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3 font-medium text-deep-navy">{row.name}</td>
                  <td className="px-4 py-3 text-warm-slate">{row.city ?? "—"}</td>
                  <td className="px-4 py-3 text-warm-slate">{row.creatorName}</td>
                  <td className="px-4 py-3 text-warm-slate">{row.memberCount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {new Date(row.createdAt).toLocaleDateString("es-ES")}
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
    </div>
  );
}
