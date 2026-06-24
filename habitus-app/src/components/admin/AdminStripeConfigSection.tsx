import { useCallback, useEffect, useState } from "react";
import { es } from "@habitus/core";
import { Icon } from "../Icon";
import { LoadingState } from "../PageState";
import { AdminAlert, AdminSection } from "./AdminPageShell";
import {
  AdminFormField,
  adminButtonPrimary,
  adminButtonSecondary,
  adminInputClass,
} from "./AdminFormField";
import {
  fetchIntegrationHealth,
  saveStripeIntegration,
  type IntegrationHealth,
} from "../../lib/admin/integrations";

type FormState = {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeIdentitySuccessUrl: string;
  retentionDays: string;
};

type Props = {
  compact?: boolean;
  onSaved?: () => void;
};

export function AdminStripeConfigSection({ compact = false, onSaved }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [stripe, setStripe] = useState<IntegrationHealth["stripe"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchIntegrationHealth()
      .then((h) => {
        setStripe(h.stripe);
        setForm({
          stripeSecretKey: "",
          stripeWebhookSecret: "",
          stripeIdentitySuccessUrl: h.stripe.stripeIdentitySuccessUrl,
          retentionDays: String(h.stripe.retentionDays),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await saveStripeIntegration({
        stripeIdentitySuccessUrl: form.stripeIdentitySuccessUrl.trim(),
        retentionDays: Math.max(1, Number(form.retentionDays) || 30),
        ...(form.stripeSecretKey.trim() ? { stripeSecretKey: form.stripeSecretKey.trim() } : {}),
        ...(form.stripeWebhookSecret.trim() ? { stripeWebhookSecret: form.stripeWebhookSecret.trim() } : {}),
      });
      setStripe(saved);
      setForm((f) =>
        f
          ? { ...f, stripeSecretKey: "", stripeWebhookSecret: "", stripeIdentitySuccessUrl: saved.stripeIdentitySuccessUrl }
          : f,
      );
      setSuccess(es.admin.stripeConfig.saved);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : es.common.errorLoad);
    } finally {
      setSaving(false);
    }
  }

  async function clearSecret(field: "clearStripeSecret" | "clearWebhookSecret") {
    if (!window.confirm(es.admin.stripeConfig.clearConfirm)) return;
    setSaving(true);
    try {
      const saved = await saveStripeIntegration({ [field]: true });
      setStripe(saved);
      setSuccess(es.admin.stripeConfig.keyCleared);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : es.common.errorLoad);
    } finally {
      setSaving(false);
    }
  }

  const statusBadge = stripe?.ready ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <Icon name="check_circle" className="text-[14px]" />
      Listo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      <Icon name="warning" className="text-[14px]" />
      Incompleto
    </span>
  );

  const body = loading ? (
    <LoadingState />
  ) : !form ? null : (
    <form onSubmit={handleSave} className="space-y-4">
      {error && <AdminAlert message={error} />}
      {success && <AdminAlert message={success} variant="success" />}

      {!stripe?.ready && (
        <AdminAlert
          variant="warning"
          message={es.admin.stripeConfig.incompleteHint}
        />
      )}

      <AdminFormField
        label={es.admin.stripeConfig.secretKey}
        hint={es.admin.stripeConfig.secretKeyHint}
      >
        <input
          type="password"
          value={form.stripeSecretKey}
          onChange={(e) => setForm({ ...form, stripeSecretKey: e.target.value })}
          placeholder={
            stripe?.stripeConfigured
              ? "•••••••• (dejar vacío para no cambiar)"
              : "sk_test_… o sk_live_…"
          }
          className={adminInputClass}
          autoComplete="off"
        />
      </AdminFormField>

      <AdminFormField
        label={es.admin.stripeConfig.webhookSecret}
        hint={es.admin.stripeConfig.webhookHint}
      >
        <input
          type="password"
          value={form.stripeWebhookSecret}
          onChange={(e) => setForm({ ...form, stripeWebhookSecret: e.target.value })}
          placeholder={
            stripe?.webhookConfigured
              ? "•••••••• (dejar vacío para no cambiar)"
              : "whsec_…"
          }
          className={adminInputClass}
          autoComplete="off"
        />
      </AdminFormField>

      <AdminFormField
        label={es.admin.stripeConfig.successUrl}
        hint={es.admin.stripeConfig.successUrlHint}
      >
        <input
          type="url"
          value={form.stripeIdentitySuccessUrl}
          onChange={(e) => setForm({ ...form, stripeIdentitySuccessUrl: e.target.value })}
          placeholder="https://www.moonsharedliving.com/verificacion?stripe=complete"
          className={adminInputClass}
          required
        />
      </AdminFormField>

      <AdminFormField label={es.admin.stripeConfig.retentionDays} hint={es.admin.stripeConfig.retentionHint}>
        <input
          type="number"
          min={1}
          max={365}
          value={form.retentionDays}
          onChange={(e) => setForm({ ...form, retentionDays: e.target.value })}
          className={adminInputClass}
        />
      </AdminFormField>

      <div className="flex flex-wrap gap-2 border-t border-border-light pt-3">
        <button type="submit" disabled={saving} className={adminButtonPrimary}>
          <Icon name="save" className="text-[18px]" />
          {saving ? es.admin.stripeConfig.saving : es.admin.stripeConfig.save}
        </button>
        {stripe?.stripeSecretSource === "database" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void clearSecret("clearStripeSecret")}
            className={adminButtonSecondary}
          >
            {es.admin.stripeConfig.clearStripe}
          </button>
        )}
        {stripe?.webhookSecretSource === "database" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void clearSecret("clearWebhookSecret")}
            className={adminButtonSecondary}
          >
            {es.admin.stripeConfig.clearWebhook}
          </button>
        )}
      </div>
    </form>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-border-light bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border-light px-4 py-3">
          <div>
            <h3 className="text-label-md font-semibold text-deep-navy">{es.admin.stripeConfig.title}</h3>
            <p className="text-[11px] text-warm-slate">{es.admin.stripeConfig.subtitle}</p>
          </div>
          {statusBadge}
        </div>
        <div className="p-4">{body}</div>
      </div>
    );
  }

  return (
    <AdminSection
      title={es.admin.stripeConfig.title}
      description={es.admin.stripeConfig.subtitle}
      actions={statusBadge}
    >
      {body}
    </AdminSection>
  );
}
