import { useState } from "react";
import { accountRoleLabel, adminBroadcastNotification, es, type AccountRoleSlug } from "@habitus/core";
import { AdminFilterField } from "../../components/admin/AdminToolbar";
import { supabase } from "../../lib/supabase";

const ROLES: AccountRoleSlug[] = ["inquilino", "anfitrion", "propietario", "agencia", "embajador"];

const MOON_CITIES = ["Barcelona", "Madrid"];

type BroadcastState =
  | { phase: "idle" }
  | { phase: "dry_done"; count: number }
  | { phase: "sent"; count: number };

export function AdminNotificacionesPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<BroadcastState>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);

  const selectClass = "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[140px]";

  async function getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function handleDryRun() {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setError(null);
    setState({ phase: "idle" });
    const token = await getToken();
    if (!token) { setError("No autenticado."); setBusy(false); return; }
    const { count, error: err } = await adminBroadcastNotification(
      { title, body, roleFilter: roleFilter || undefined, cityFilter: cityFilter || undefined, dryRun: true },
      token,
    );
    if (err) setError(err);
    else setState({ phase: "dry_done", count });
    setBusy(false);
  }

  async function handleSend() {
    if (state.phase !== "dry_done" || busy) return;
    setBusy(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("No autenticado."); setBusy(false); return; }
    const { count, error: err } = await adminBroadcastNotification(
      { title, body, roleFilter: roleFilter || undefined, cityFilter: cityFilter || undefined, dryRun: false },
      token,
    );
    if (err) setError(err);
    else {
      setState({ phase: "sent", count });
      setTitle("");
      setBody("");
      setRoleFilter("");
      setCityFilter("");
    }
    setBusy(false);
  }

  function handleReset() {
    setState({ phase: "idle" });
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-headline-lg text-deep-navy">{es.admin.notificationsTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.notificationsSubtitle}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}

      {state.phase === "sent" ? (
        <div className="mt-8 rounded-xl border border-teal-accent/30 bg-teal-accent/5 p-6 text-center">
          <p className="text-headline-md text-teal-accent">✓ Enviado</p>
          <p className="mt-1 text-body-sm text-warm-slate">
            {state.count} usuario{state.count !== 1 ? "s" : ""} notificado{state.count !== 1 ? "s" : ""}.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy hover:bg-surface-container"
          >
            Nueva notificación
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">

          <div>
            <label className="mb-1 block text-label-sm text-warm-slate">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setState({ phase: "idle" }); }}
              placeholder="Título de la notificación"
              className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-label-sm text-warm-slate">Mensaje *</label>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setState({ phase: "idle" }); }}
              rows={3}
              placeholder="Texto de la notificación…"
              className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <AdminFilterField label="Filtrar por rol">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setState({ phase: "idle" }); }}
                className={selectClass}
              >
                <option value="">Todos los roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{accountRoleLabel(r)}</option>
                ))}
              </select>
            </AdminFilterField>
            <AdminFilterField label="Filtrar por ciudad">
              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setState({ phase: "idle" }); }}
                className={selectClass}
              >
                <option value="">Todas las ciudades</option>
                {MOON_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </AdminFilterField>
          </div>

          {/* Dry-run result */}
          {state.phase === "dry_done" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
              <strong>Previsualización:</strong> Se enviará a{" "}
              <strong>{state.count} usuario{state.count !== 1 ? "s" : ""}</strong>.
              {state.count === 0 && " Ningún usuario coincide con los filtros."}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              disabled={busy || !title.trim() || !body.trim()}
              onClick={handleDryRun}
              className="rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container disabled:opacity-50"
            >
              {busy && state.phase === "idle" ? "Calculando…" : "Ver cuántos recibirán"}
            </button>
            {state.phase === "dry_done" && state.count > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={handleSend}
                className="rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary disabled:opacity-50"
              >
                {busy ? "Enviando…" : `Confirmar y enviar a ${state.count}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
