import { useCallback, useEffect, useState } from "react";
import { es, fetchAdminAuditLog, type AdminAuditEntry } from "@habitus/core";
import { ErrorState, LoadingState } from "../../components/PageState";
import { AdminCount, AdminPageShell } from "../../components/admin/AdminPageShell";

const ACTION_LABELS: Record<string, string> = {
  suspend_user:    "Suspender usuario",
  unsuspend_user:  "Reactivar usuario",
  delete_user:     "Eliminar usuario",
  set_role:        "Cambiar rol",
  set_admin:       "Cambiar admin",
  set_identity:    "Verificar identidad",
  set_discoverable:"Cambiar visibilidad",
  create_intro:    "Crear introducción",
  update_intro:    "Actualizar introducción",
  invite_ambassador: "Invitar embajador",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export function AdminAuditoriaPage() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminAuditLog(300)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.adminName.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.targetId.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;
  if (error && entries.length === 0) return <ErrorState message={error} />;

  return (
    <AdminPageShell title={es.admin.auditTitle} subtitle={es.admin.auditSubtitle}>

      <div className="mt-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por admin, acción o ID…"
          className="w-full max-w-sm rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm"
        />
      </div>

      <AdminCount current={filtered.length} total={entries.length} />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">No hay registros de auditoría todavía.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[760px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="px-4 py-3 text-label-md text-deep-navy">Fecha</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Admin</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Acción</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Tipo</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">ID objetivo</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3 text-warm-slate whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-medium text-deep-navy">{entry.adminName}</td>
                  <td className="px-4 py-3 text-deep-navy">{actionLabel(entry.action)}</td>
                  <td className="px-4 py-3 text-warm-slate">{entry.targetType}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-warm-slate">
                    {entry.targetId.slice(0, 16)}…
                  </td>
                  <td className="px-4 py-3 text-[11px] text-warm-slate">
                    {Object.keys(entry.payload).length > 0
                      ? JSON.stringify(entry.payload).slice(0, 60)
                      : "—"}
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
