import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminBulkUpdateReportStatus,
  es,
  fetchAdminReports,
  updateReportStatus,
  type AdminReport,
} from "@habitus/core";
import { AdminBulkBar, AdminFilterField } from "../../components/admin/AdminToolbar";
import { LoadingState, ErrorState } from "../../components/PageState";

const selectClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[140px]";

export function AdminReportsPage() {
  const [rows, setRows] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminReports()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const types = useMemo(
    () => [...new Set(rows.map((r) => r.targetType))].sort(),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (typeFilter && row.targetType !== typeFilter) return false;
        return true;
      }),
    [rows, statusFilter, typeFilter],
  );

  const filteredIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const selectedInView = useMemo(
    () => [...selected].filter((id) => filteredIds.has(id)),
    [selected, filteredIds],
  );
  const allFilteredSelected =
    filtered.length > 0 && selectedInView.length === filtered.length;

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

  async function setStatus(id: string, status: AdminReport["status"]) {
    setBusyId(id);
    const err = await updateReportStatus(id, status);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setBusyId(null);
  }

  async function runBulk(status: AdminReport["status"]) {
    const ids = selectedInView;
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    const err = await adminBulkUpdateReportStatus(ids, status);
    if (err) {
      setError(err);
    } else {
      const idSet = new Set(ids);
      setRows((prev) => prev.map((r) => (idSet.has(r.id) ? { ...r, status } : r)));
      setSelected(new Set());
    }
    setBulkBusy(false);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  const f = es.admin.filters;

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.reportsTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.reportsSubtitle}</p>
      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label={f.reportStatus}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allStatuses}</option>
            {(["open", "reviewing", "resolved", "dismissed"] as const).map((s) => (
              <option key={s} value={s}>
                {es.admin.reportStatus[s]}
              </option>
            ))}
          </select>
        </AdminFilterField>
        <AdminFilterField label="Tipo">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allCategories}</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </AdminFilterField>
        {(statusFilter || typeFilter) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
            }}
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
            label: es.admin.bulk.review,
            onClick: () => runBulk("reviewing"),
          },
          {
            label: es.admin.bulk.resolve,
            variant: "primary",
            onClick: () => runBulk("resolved"),
          },
          {
            label: es.admin.bulk.dismiss,
            onClick: () => runBulk("dismissed"),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">
          {rows.length === 0 ? es.admin.reportsEmpty : f.noResults}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((row) => (
            <article
              key={row.id}
              className="rounded-xl border border-border-light bg-surface-container-lowest p-5"
            >
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={() => toggleRow(row.id)}
                  className="mt-1 h-4 w-4 rounded border-border-light"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-label-md uppercase text-teal-accent">{row.targetType}</p>
                      <p className="mt-1 text-body-md text-deep-navy">{row.reason}</p>
                      <p className="mt-2 text-label-sm text-warm-slate">
                        {new Date(row.createdAt).toLocaleString("es-ES")} · ID{" "}
                        {row.targetId.slice(0, 8)}…
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-deep-navy">
                      {es.admin.reportStatus[row.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["reviewing", "resolved", "dismissed"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busyId === row.id || bulkBusy || row.status === status}
                        onClick={() => setStatus(row.id, status)}
                        className="rounded-lg border border-border-light px-3 py-1 text-label-sm hover:bg-surface-container disabled:opacity-50"
                      >
                        {es.admin.reportStatus[status]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
