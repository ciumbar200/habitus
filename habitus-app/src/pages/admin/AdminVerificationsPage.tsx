import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { ErrorState, LoadingState, EmptyState } from "../../components/PageState";
import { AdminAlert, AdminPageShell, AdminSection, AdminStatCard } from "../../components/admin/AdminPageShell";
import {
  AdminBadge,
  AdminDataTable,
  AdminTableBody,
  AdminTableHead,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "../../components/admin/AdminDataTable";
import { AdminIntegrationHealthBar } from "../../components/admin/AdminIntegrationHealthBar";
import { AdminStripeConfigSection } from "../../components/admin/AdminStripeConfigSection";
import { AdminFilterField } from "../../components/admin/AdminToolbar";
import { adminInputClass, adminSelectClass, adminButtonPrimary } from "../../components/admin/AdminFormField";
import { adminFetchVerifications, adminReviewVerification } from "../../lib/verification";
import { es } from "@habitus/core";

type Row = {
  id: string;
  user_id: string;
  verification_type: string;
  status: string;
  created_at: string;
  ai_result: Record<string, unknown> | null;
  risk_flags: string[];
  profile: { display_name?: string; account_role?: string } | null;
  documents: Array<string | null>;
};

const ACTIONS = [
  { value: "approve", label: "Aprobar Basic Trust", icon: "check_circle", primary: true },
  { value: "reject", label: "Rechazar", icon: "cancel", needsReason: true },
  { value: "retry", label: "Pedir reintento", icon: "refresh", needsReason: true },
  { value: "require_stripe", label: "Escalar a Stripe", icon: "verified_user" },
  { value: "suspicious", label: "Marcar sospechoso", icon: "warning" },
] as const;

const DOC_LABELS = ["Documento frontal", "Documento trasero", "Selfie", "Selfie con código"];

function statusVariant(status: string): "success" | "warning" | "error" | "default" {
  if (status.includes("verified") || status === "approved") return "success";
  if (status.includes("pending") || status === "under_review") return "warning";
  if (status.includes("reject") || status === "suspicious") return "error";
  return "default";
}

export function AdminVerificationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthKey, setHealthKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows((await adminFetchVerifications()) as unknown as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (typeFilter && row.verification_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = row.profile?.display_name?.toLowerCase() ?? "";
        if (!name.includes(q) && !row.user_id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, typeFilter, search]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))].sort(), [rows]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.verification_type))].sort(), [rows]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status.includes("pending") || r.status === "under_review").length;
    const stripe = rows.filter((r) => r.verification_type === "stripe_identity").length;
    const flagged = rows.filter((r) => (r.risk_flags?.length ?? 0) > 0).length;
    return { total: rows.length, pending, stripe, flagged };
  }, [rows]);

  async function open(row: Row, index: number) {
    setBusy(true);
    setError(null);
    setReason("");
    try {
      const detail = (await adminFetchVerifications(row.id)) as unknown as Row[];
      setSelected(detail[0] ?? null);
      setSelectedIndex(index);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los documentos.");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await adminReviewVerification(
        selected.id,
        action,
        action === "reject" || action === "retry" ? reason.trim() || undefined : undefined,
      );
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  function navigate(delta: number) {
    const next = filtered[selectedIndex + delta];
    if (next) void open(next, selectedIndex + delta);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  return (
    <AdminPageShell
      title={es.admin.verificationsTitle}
      subtitle={es.admin.verificationsSubtitle}
      actions={
        <Link
          to="/admin/integraciones"
          className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-white px-4 py-2 text-label-sm font-medium text-deep-navy shadow-sm hover:bg-surface-container"
        >
          <Icon name="tune" className="text-[18px]" />
          {es.admin.integrations.configure}
        </Link>
      }
    >
      <AdminIntegrationHealthBar key={healthKey} configureHref="/admin/integraciones" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="En cola" value={stats.total} icon="inbox" />
        <AdminStatCard label="Pendientes" value={stats.pending} icon="hourglass_empty" />
        <AdminStatCard label="Stripe Identity" value={stats.stripe} icon="verified_user" />
        <AdminStatCard label="Con alertas IA" value={stats.flagged} icon="flag" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {error && <AdminAlert message={error} />}

          <AdminSection
            title="Cola de revisión"
            description={`${filtered.length} de ${rows.length} solicitudes`}
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <AdminFilterField label="Buscar">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre o ID…"
                  className={adminInputClass}
                />
              </AdminFilterField>
              <AdminFilterField label="Estado">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={adminSelectClass}
                >
                  <option value="">Todos</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </AdminFilterField>
              <AdminFilterField label="Tipo">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={adminSelectClass}
                >
                  <option value="">Todos</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </AdminFilterField>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon="verified_user" title="No hay verificaciones con estos filtros" />
            ) : (
              <AdminDataTable minWidth="640px">
                <AdminTableHead>
                  <AdminTableTh>Usuario</AdminTableTh>
                  <AdminTableTh>Tipo</AdminTableTh>
                  <AdminTableTh>Estado</AdminTableTh>
                  <AdminTableTh>Fecha</AdminTableTh>
                  <AdminTableTh>Alertas</AdminTableTh>
                </AdminTableHead>
                <AdminTableBody>
                  {filtered.map((row, index) => (
                    <AdminTableRow
                      key={row.id}
                      onClick={() => void open(row, index)}
                    >
                      <AdminTableTd className="font-medium">
                        {row.profile?.display_name ?? row.user_id.slice(0, 8)}
                        {row.profile?.account_role && (
                          <span className="mt-0.5 block text-[11px] font-normal text-warm-slate">
                            {row.profile.account_role}
                          </span>
                        )}
                      </AdminTableTd>
                      <AdminTableTd className="text-warm-slate">{row.verification_type}</AdminTableTd>
                      <AdminTableTd>
                        <AdminBadge variant={statusVariant(row.status)}>{row.status}</AdminBadge>
                      </AdminTableTd>
                      <AdminTableTd className="text-[11px] text-warm-slate">
                        {new Date(row.created_at).toLocaleString("es-ES")}
                      </AdminTableTd>
                      <AdminTableTd>
                        {(row.risk_flags?.length ?? 0) > 0 ? (
                          <AdminBadge variant="warning">{row.risk_flags.length}</AdminBadge>
                        ) : (
                          <span className="text-warm-slate/50">—</span>
                        )}
                      </AdminTableTd>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminDataTable>
            )}
          </AdminSection>
        </div>

        <div className="space-y-4">
          <AdminStripeConfigSection compact onSaved={() => setHealthKey((k) => k + 1)} />
          <div className="rounded-2xl border border-border-light bg-deep-navy p-5 text-on-primary shadow-sm">
            <h3 className="text-label-md font-semibold">Flujo híbrido</h3>
            <ol className="mt-3 space-y-2 text-body-sm text-on-primary/80">
              <li className="flex gap-2">
                <span className="font-bold text-teal-accent">1.</span>
                Usuario sube documentos (Basic Trust)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-teal-accent">2.</span>
                IA pre-analiza (no vinculante)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-teal-accent">3.</span>
                Admin aprueba o escala a Stripe Identity
              </li>
            </ol>
          </div>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto bg-deep-navy/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <article
            className="mx-auto my-6 flex max-w-6xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-light px-6 py-4">
              <div>
                <p className="text-label-sm text-warm-slate">
                  Caso {selectedIndex + 1} de {filtered.length}
                </p>
                <h2 className="text-headline-md text-deep-navy">
                  {selected.profile?.display_name ?? "Usuario"}
                </h2>
                <div className="mt-1 flex flex-wrap gap-2">
                  <AdminBadge variant={statusVariant(selected.status)}>{selected.status}</AdminBadge>
                  <AdminBadge>{selected.verification_type}</AdminBadge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedIndex <= 0 || busy}
                  onClick={() => navigate(-1)}
                  className="rounded-lg border border-border-light p-2 hover:bg-surface-container disabled:opacity-40"
                  aria-label="Anterior"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  type="button"
                  disabled={selectedIndex >= filtered.length - 1 || busy}
                  onClick={() => navigate(1)}
                  className="rounded-lg border border-border-light p-2 hover:bg-surface-container disabled:opacity-40"
                  aria-label="Siguiente"
                >
                  <Icon name="chevron_right" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-border-light p-2 hover:bg-surface-container"
                  aria-label="Cerrar"
                >
                  <Icon name="close" />
                </button>
              </div>
            </header>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-label-md font-semibold text-deep-navy">Documentos</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.documents.map(
                    (url, index) =>
                      url && (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-xl border border-border-light"
                        >
                          <img
                            src={url}
                            alt={DOC_LABELS[index]}
                            className="h-48 w-full bg-surface-container/30 object-contain transition group-hover:opacity-90"
                          />
                          <span className="block bg-surface-container/50 p-2 text-label-sm text-deep-navy">
                            {DOC_LABELS[index]}
                          </span>
                        </a>
                      ),
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border border-border-light bg-surface-container/40 p-4">
                  <h3 className="text-label-md font-semibold text-deep-navy">Análisis IA (no vinculante)</h3>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-warm-slate">
                    {JSON.stringify(selected.ai_result, null, 2) ?? "Sin análisis"}
                  </pre>
                </section>
                <section className="rounded-xl border border-border-light bg-surface-container/40 p-4">
                  <h3 className="text-label-md font-semibold text-deep-navy">Señales de riesgo</h3>
                  <p className="mt-2 text-body-sm text-warm-slate">
                    {selected.risk_flags?.length ? selected.risk_flags.join(" · ") : "Sin señales detectadas"}
                  </p>
                </section>
                <div>
                  <label htmlFor="review-reason" className="text-label-sm font-medium text-warm-slate">
                    Motivo (rechazo / reintento)
                  </label>
                  <textarea
                    id="review-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Opcional pero recomendado para auditoría…"
                    className={`${adminInputClass} mt-1 resize-none`}
                  />
                </div>
              </div>
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-border-light px-6 py-4">
              {ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={busy || (action.value === "approve" && selected.verification_type !== "basic_trust")}
                  onClick={() => void act(action.value)}
                  className={
                    "primary" in action && action.primary
                      ? adminButtonPrimary
                      : "inline-flex items-center gap-2 rounded-xl border border-border-light px-4 py-2 text-label-sm font-medium text-deep-navy hover:bg-surface-container disabled:opacity-40"
                  }
                >
                  <Icon name={action.icon} className="text-[18px]" />
                  {action.label}
                </button>
              ))}
            </footer>
          </article>
        </div>
      )}
    </AdminPageShell>
  );
}
