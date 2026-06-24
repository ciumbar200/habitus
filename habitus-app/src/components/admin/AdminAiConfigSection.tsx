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
import { fetchAdminAiConfig, saveAdminAiConfig, type AdminAiConfigView } from "../../lib/admin/aiConfig";

const MODEL_SUGGESTIONS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "openai/gpt-5-mini",
  "anthropic/claude-sonnet-4",
  "google/gemini-2.5-flash",
];

type FormState = {
  gatewayBaseUrl: string;
  defaultModel: string;
  matchModel: string;
  safetyModel: string;
  visionModel: string;
  apiKey: string;
};

function toForm(config: AdminAiConfigView): FormState {
  return {
    gatewayBaseUrl: config.gatewayBaseUrl,
    defaultModel: config.defaultModel,
    matchModel: config.matchModel,
    safetyModel: config.safetyModel,
    visionModel: config.visionModel,
    apiKey: "",
  };
}

export function AdminAiConfigSection() {
  const [form, setForm] = useState<FormState | null>(null);
  const [meta, setMeta] = useState<{ apiKeyConfigured: boolean; apiKeySource: string; updatedAt: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminAiConfig()
      .then(({ config, updatedAt }) => {
        setForm(toForm(config));
        setMeta({
          apiKeyConfigured: config.apiKeyConfigured,
          apiKeySource: config.apiKeySource,
          updatedAt,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await saveAdminAiConfig({
        gatewayBaseUrl: form.gatewayBaseUrl,
        defaultModel: form.defaultModel,
        matchModel: form.matchModel,
        safetyModel: form.safetyModel,
        visionModel: form.visionModel,
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      });
      setForm(toForm(saved));
      setMeta({
        apiKeyConfigured: saved.apiKeyConfigured,
        apiKeySource: saved.apiKeySource,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(es.admin.aiConfig.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : es.common.errorLoad);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearApiKey() {
    if (!window.confirm(es.admin.aiConfig.clearKeyConfirm)) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAdminAiConfig({ clearApiKey: true });
      setForm((f) => (f ? { ...f, apiKey: "" } : f));
      setMeta({
        apiKeyConfigured: saved.apiKeyConfigured,
        apiKeySource: saved.apiKeySource,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(es.admin.aiConfig.keyCleared);
    } catch (err) {
      setError(err instanceof Error ? err.message : es.common.errorLoad);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminSection
      title={es.admin.aiConfig.title}
      description={es.admin.aiConfig.subtitle}
      actions={
        meta?.apiKeyConfigured ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-label-sm font-medium text-emerald-700">
            <Icon name="check_circle" className="text-[16px]" />
            API {meta.apiKeySource === "database" ? "en BD" : "en Vercel"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-label-sm font-medium text-amber-800">
            <Icon name="warning" className="text-[16px]" />
            Sin API key
          </span>
        )
      }
    >
      {loading ? (
        <LoadingState />
      ) : !form ? null : (
        <form onSubmit={handleSave} className="space-y-5">
          {error && <AdminAlert message={error} />}
          {success && <AdminAlert message={success} variant="success" />}

          <AdminFormField label={es.admin.aiConfig.gatewayUrl} hint={es.admin.aiConfig.gatewayHint}>
            <input
              type="url"
              value={form.gatewayBaseUrl}
              onChange={(e) => patch("gatewayBaseUrl", e.target.value)}
              className={adminInputClass}
              required
            />
          </AdminFormField>

          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["defaultModel", es.admin.aiConfig.defaultModel],
                ["matchModel", es.admin.aiConfig.matchModel],
                ["safetyModel", es.admin.aiConfig.safetyModel],
                ["visionModel", es.admin.aiConfig.visionModel],
              ] as const
            ).map(([key, label]) => (
              <AdminFormField key={key} label={label}>
                <input
                  list="ai-model-suggestions"
                  value={form[key]}
                  onChange={(e) => patch(key, e.target.value)}
                  className={adminInputClass}
                  required
                />
              </AdminFormField>
            ))}
          </div>
          <datalist id="ai-model-suggestions">
            {MODEL_SUGGESTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <AdminFormField
            label={es.admin.aiConfig.apiKey}
            hint={es.admin.aiConfig.apiKeyHint}
          >
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => patch("apiKey", e.target.value)}
              placeholder={meta?.apiKeyConfigured ? "•••••••• (dejar vacío para no cambiar)" : "sk-…"}
              className={adminInputClass}
              autoComplete="off"
            />
          </AdminFormField>

          <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
            <button type="submit" disabled={saving} className={adminButtonPrimary}>
              <Icon name="save" className="text-[18px]" />
              {saving ? es.admin.aiConfig.saving : es.admin.aiConfig.save}
            </button>
            {meta?.apiKeySource === "database" && (
              <button type="button" disabled={saving} onClick={() => void handleClearApiKey()} className={adminButtonSecondary}>
                {es.admin.aiConfig.clearKey}
              </button>
            )}
          </div>
        </form>
      )}
    </AdminSection>
  );
}
