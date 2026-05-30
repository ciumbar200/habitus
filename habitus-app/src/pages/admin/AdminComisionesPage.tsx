import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAmbassadorCommissionStats,
  fetchAllAmbassadorCommissions,
  approveAmbassadorCommission,
  markCommissionPaid,
  createAmbassadorCommission,
  fetchAdminAmbassadors,
  es,
  type AmbassadorCommission,
  type AmbassadorCommissionStats,
  type CommissionStatus,
  type AmbassadorCommissionType,
} from "@habitus/core";
import { AdminBulkBar, AdminFilterField } from "../../components/admin/AdminToolbar";
import { LoadingState, ErrorState } from "../../components/PageState";

const selectClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[120px]";
const inputClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm w-full min-w-[200px]";

export function AdminComisionesPage() {
  const [stats, setStats] = useState<AmbassadorCommissionStats[]>([]);
  const [commissions, setCommissions] = useState<AmbassadorCommission[]>([]);
  const [ambassadors, setAmbassadors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modal state for creating commission
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    ambassadorId: "",
    referredId: "",
    amount: "",
    commissionType: "manual" as AmbassadorCommissionType,
    notes: "",
  });
  const [createBusy, setCreateBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAmbassadorCommissionStats(),
      fetchAllAmbassadorCommissions(),
      fetchAdminAmbassadors(),
    ])
      .then(([statsData, commissionsData, ambassadorsData]) => {
        setStats(statsData);
        setCommissions(commissionsData);
        setAmbassadors(ambassadorsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.ambassadorName?.toLowerCase().includes(q) ?? false) ||
        (c.ambassadorEmail?.toLowerCase().includes(q) ?? false) ||
        (c.referredName?.toLowerCase().includes(q) ?? false) ||
        c.commissionType.toLowerCase().includes(q)
      );
    });
  }, [commissions, statusFilter, search]);

  const filteredIds = useMemo(() => new Set(filtered.map((c) => c.id)), [filtered]);
  const selectedInView = useMemo(
    () => [...selected].filter((id) => filteredIds.has(id)),
    [selected, filteredIds]
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

  async function approveCommission(id: string) {
    setBusyId(id);
    const err = await approveAmbassadorCommission(id);
    if (err) setError(err);
    else
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" as CommissionStatus } : c))
      );
    setBusyId(null);
  }

  async function markPaid(id: string) {
    setBusyId(id);
    const err = await markCommissionPaid(id);
    if (err) setError(err);
    else
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "paid" as CommissionStatus } : c))
      );
    setBusyId(null);
  }

  async function handleCreateCommission(e: React.FormEvent) {
    e.preventDefault();
    if (createBusy || !createForm.ambassadorId || !createForm.referredId || !createForm.amount)
      return;

    setCreateBusy(true);
    setError(null);

    const err = await createAmbassadorCommission(
      createForm.ambassadorId,
      createForm.referredId,
      Number(createForm.amount),
      createForm.commissionType,
      createForm.notes || undefined
    );

    if (err) {
      setError(err);
    } else {
      setShowCreateModal(false);
      setCreateForm({
        ambassadorId: "",
        referredId: "",
        amount: "",
        commissionType: "manual",
        notes: "",
      });
      load(); // Reload to show new commission
    }
    setCreateBusy(false);
  }

  const statusLabel: Record<CommissionStatus, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    paid: "Pagado",
    rejected: "Rechazado",
  };

  const statusClass: Record<CommissionStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  if (loading) return <LoadingState />;
  if (error && commissions.length === 0) return <ErrorState message={error} />;

  const totalPaid = stats.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalPending = stats.reduce((sum, s) => sum + s.totalPending, 0);
  const totalApproved = stats.reduce((sum, s) => sum + s.totalApproved, 0);

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">Comisiones de Embajadores</h1>
      <p className="mt-2 text-body-lg text-warm-slate">
        Gestiona las comisiones que los embajadores ganan por referidos convertidos.
      </p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-4">
          <p className="text-label-sm text-warm-slate">Total pagado</p>
          <p className="mt-1 text-headline-md text-deep-navy">{totalPaid.toFixed(2)} €</p>
        </div>
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-4">
          <p className="text-label-sm text-warm-slate">Por aprobar</p>
          <p className="mt-1 text-headline-md text-deep-navy">{totalPending.toFixed(2)} €</p>
        </div>
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-4">
          <p className="text-label-sm text-warm-slate">Aprobado (sin pagar)</p>
          <p className="mt-1 text-headline-md text-deep-navy">{totalApproved.toFixed(2)} €</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label="Estado">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="paid">Pagado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </AdminFilterField>
        <AdminFilterField label="Buscar">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Embajador, referido..."
            className={inputClass}
          />
        </AdminFilterField>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary hover:bg-teal-accent/90"
        >
          + Crear comisión
        </button>
      </div>

      {/* Commissions table */}
      <p className="mt-3 text-label-sm text-warm-slate">
        {filtered.length} / {commissions.length}
      </p>

      <AdminBulkBar
        selectedCount={selectedInView.length}
        filteredCount={filtered.length}
        allSelected={allFilteredSelected}
        busy={false}
        onToggleAll={toggleAllFiltered}
        onDeselectAll={deselectAll}
        actions={[]}
      />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">No hay comisiones con estos filtros.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[900px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="px-4 py-3 text-label-md text-deep-navy">Embajador</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Referido</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Tipo</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Importe</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Fecha evento</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border-light align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleRow(c.id)}
                      className="h-4 w-4 rounded border-border-light"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-deep-navy">{c.ambassadorName || "—"}</p>
                    <p className="text-[12px] text-warm-slate">{c.ambassadorEmail || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-deep-navy">{c.referredName || "—"}</p>
                    <p className="text-[12px] text-warm-slate">{c.referredEmail || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {c.commissionType === "premium_conversion" && "Premium"}
                    {c.commissionType === "contract_payment" && "Contrato"}
                    {c.commissionType === "manual" && "Manual"}
                  </td>
                  <td className="px-4 py-3 font-medium text-deep-navy">
                    {c.amount} {c.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[c.status]}`}
                    >
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {new Date(c.eventDate).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {c.status === "pending" && (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => approveCommission(c.id)}
                          className="rounded-lg border border-teal-accent px-2 py-0.5 text-[11px] text-teal-accent disabled:opacity-50 hover:bg-teal-accent/10"
                        >
                          Aprobar
                        </button>
                      )}
                      {c.status === "approved" && (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => markPaid(c.id)}
                          className="rounded-lg border border-teal-accent bg-teal-accent px-2 py-0.5 text-[11px] text-on-primary disabled:opacity-50 hover:bg-teal-accent/90"
                        >
                          Marcar pagado
                        </button>
                      )}
                      {c.notes && (
                        <span className="text-[11px] text-warm-slate" title={c.notes}>
                          Nota
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create commission modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-headline-md text-deep-navy">Crear comisión manual</h2>
            <form onSubmit={handleCreateCommission} className="space-y-4">
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Embajador</label>
                <select
                  value={createForm.ambassadorId}
                  onChange={(e) => setCreateForm({ ...createForm, ambassadorId: e.target.value })}
                  className={selectClass}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {ambassadors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Usuario referido (ID)</label>
                <input
                  type="text"
                  value={createForm.referredId}
                  onChange={(e) => setCreateForm({ ...createForm, referredId: e.target.value })}
                  className={inputClass}
                  placeholder="UUID del usuario referido"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Importe (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  className={inputClass}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Tipo</label>
                <select
                  value={createForm.commissionType}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, commissionType: e.target.value as AmbassadorCommissionType })
                  }
                  className={selectClass}
                >
                  <option value="manual">Manual</option>
                  <option value="premium_conversion">Conversión a premium</option>
                  <option value="contract_payment">Pago de contrato</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Notas (opcional)</label>
                <input
                  type="text"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className={inputClass}
                  placeholder="Razón de la comisión..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-border-light px-4 py-2 text-label-sm hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary disabled:opacity-50 hover:bg-teal-accent/90"
                >
                  {createBusy ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
