import { useCallback, useEffect, useState } from "react";
import {
  adminInviteAmbassador,
  adminSetAccountRole,
  buildReferralUrl,
  es,
  fetchAdminAmbassadors,
  getOrCreateReferralCode,
  type AdminAmbassador,
} from "@habitus/core";
import { Icon } from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/PageState";
import { AdminAlert, AdminPageShell } from "../../components/admin/AdminPageShell";
import { supabase } from "../../lib/supabase";

export function AdminEmbajadoresPage() {
  const [ambassadors, setAmbassadors] = useState<AdminAmbassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminAmbassadors()
      .then(setAmbassadors)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDegrade(amb: AdminAmbassador) {
    if (busyId) return;
    setBusyId(amb.id);
    const err = await adminSetAccountRole(amb.id, null);
    if (err) { setError(err); }
    else {
      setAmbassadors((prev) => prev.filter((a) => a.id !== amb.id));
      setFeedback(`${amb.displayName} ya no es embajador.`);
      setTimeout(() => setFeedback(null), 3000);
    }
    setBusyId(null);
  }

  async function handleGenerateCode(amb: AdminAmbassador) {
    if (busyId) return;
    setBusyId(amb.id);
    try {
      const code = await getOrCreateReferralCode(amb.id);
      if (code) {
        setAmbassadors((prev) =>
          prev.map((a) => (a.id === amb.id ? { ...a, referralCode: code } : a)),
        );
      }
    } catch {
      setError("No se pudo generar el código.");
    }
    setBusyId(null);
  }

  async function handleCopyLink(amb: AdminAmbassador) {
    const code = amb.referralCode;
    if (!code) return;
    const url = buildReferralUrl(code);
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(amb.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteBusy) return;
    setInviteBusy(true);
    setError(null);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) { setError("No autenticado."); setInviteBusy(false); return; }
    const { referralCode, error: inviteErr } = await adminInviteAmbassador(
      inviteEmail.trim(),
      inviteName.trim() || undefined,
      token,
    );
    if (inviteErr) {
      setError(inviteErr);
    } else {
      setFeedback(`${es.admin.inviteSuccess} Código: ${referralCode ?? "—"}`);
      setInviteEmail("");
      setInviteName("");
      setTimeout(() => { setFeedback(null); load(); }, 3000);
    }
    setInviteBusy(false);
  }

  if (loading) return <LoadingState />;
  if (error && ambassadors.length === 0) return <ErrorState message={error} />;

  return (
    <AdminPageShell title={es.admin.ambassadorsTitle} subtitle={es.admin.ambassadorsSubtitle}>
      {error && <AdminAlert message={error} />}
      {feedback && <AdminAlert message={feedback} variant="success" />}

      {/* Invitar */}
      <form
        onSubmit={handleInvite}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border-light bg-surface-container-lowest p-4"
      >
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-label-sm text-warm-slate">{es.admin.inviteEmail}</label>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-label-sm text-warm-slate">{es.admin.inviteName}</label>
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Nombre"
            className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
          />
        </div>
        <button
          type="submit"
          disabled={inviteBusy || !inviteEmail.trim()}
          className="rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary disabled:opacity-50"
        >
          <Icon name="person_add" className="mr-1 text-[16px]" />
          {es.admin.inviteAmbassador}
        </button>
      </form>

      {/* Tabla */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border-light">
        <table className="w-full min-w-[700px] text-left text-body-sm">
          <thead className="border-b border-border-light bg-surface-container">
            <tr>
              <th className="px-4 py-3 text-label-md text-deep-navy">Nombre</th>
              <th className="px-4 py-3 text-label-md text-deep-navy">Email</th>
              <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.ambassadorCode}</th>
              <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.ambassadorReferrals}</th>
              <th className="px-4 py-3 text-label-md text-deep-navy">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ambassadors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-warm-slate">
                  No hay embajadores aún.
                </td>
              </tr>
            )}
            {ambassadors.map((amb) => (
              <tr key={amb.id} className="border-b border-border-light last:border-0">
                <td className="px-4 py-3 font-medium text-deep-navy">{amb.displayName}</td>
                <td className="px-4 py-3 text-warm-slate">{amb.email}</td>
                <td className="px-4 py-3">
                  {amb.referralCode ? (
                    <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[12px]">
                      {amb.referralCode}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === amb.id}
                      onClick={() => handleGenerateCode(amb)}
                      className="text-[11px] text-teal-accent underline disabled:opacity-50"
                    >
                      Generar código
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-warm-slate">{amb.qualifiedCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {amb.referralCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(amb)}
                        className="rounded border border-border-light px-2 py-0.5 text-[11px] text-deep-navy hover:bg-surface-container"
                      >
                        {copiedId === amb.id ? "✓ Copiado" : "Copiar link"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === amb.id}
                      onClick={() => handleDegrade(amb)}
                      className="rounded border border-border-light px-2 py-0.5 text-[11px] text-warm-slate hover:bg-surface-container disabled:opacity-50"
                    >
                      {es.admin.degrade}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
