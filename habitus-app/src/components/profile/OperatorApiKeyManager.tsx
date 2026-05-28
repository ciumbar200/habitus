import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../Icon";
import {
  createOperatorApiKey,
  fetchOperatorApiKeys,
  revokeOperatorApiKey,
  type OperatorApiKey,
} from "../../lib/operatorApiKeys";
import { useI18n } from "../../lib/I18nContext";

type Props = {
  profileId: string;
};

export function OperatorApiKeyManager({ profileId }: Props) {
  const t = useI18n();
  const [keys, setKeys] = useState<OperatorApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchOperatorApiKeys()
      .then((rows) => {
        if (active) setKeys(rows);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "No se pudieron cargar las claves.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const cleaned = label.trim();
    if (!cleaned) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createOperatorApiKey(cleaned);
      setKeys((prev) => [created.key, ...prev]);
      setSecret(created.secret);
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la clave.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setError(null);
    try {
      await revokeOperatorApiKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revocar la clave.");
    } finally {
      setRevokingId(null);
    }
  }

  async function copySecret(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError("No se pudo copiar la clave.");
    }
  }

  function scopeLabel(scope: string): string {
    if (scope === "listings:read") return t.profile.operatorApiKeysScopeReadListings;
    if (scope === "listings:write") return t.profile.operatorApiKeysScopeWriteListings;
    if (scope === "applications:read") return t.profile.operatorApiKeysScopeReadApplications;
    return scope;
  }

  return (
    <section className="mt-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-headline-md text-deep-navy">{t.profile.operatorApiKeysTitle}</h3>
          <p className="mt-1 max-w-2xl text-body-md text-warm-slate">
            {t.profile.operatorApiKeysSubtitle}
          </p>
        </div>
        <p className="text-label-sm text-warm-slate">{t.profile.operatorApiKeysGeneratedNote}</p>
      </div>

      <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-label-sm text-warm-slate">{t.profile.operatorApiKeysNewLabel}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md text-deep-navy outline-none transition-colors focus:border-teal-accent"
            placeholder="Importaciones Moon"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white disabled:opacity-60"
        >
          <Icon name="add" />
          {creating ? t.common.pleaseWait : t.profile.operatorApiKeysCreateButton}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">{error}</p>}

      {secret && (
        <div className="mt-4 rounded-lg border border-teal-accent/30 bg-teal-accent/5 px-4 py-4">
          <p className="text-label-sm uppercase tracking-wider text-teal-accent">{t.profile.operatorApiKeysSecretShown}</p>
          <p className="mt-1 text-label-sm text-warm-slate">{t.profile.operatorApiKeysSecretLabel}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="break-all rounded-lg bg-white px-3 py-2 text-body-sm text-deep-navy">{secret}</code>
            <button
              type="button"
              onClick={() => copySecret(secret)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy"
            >
              <Icon name="copy" />
              {t.profile.operatorApiKeysCopySecret}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-body-md text-warm-slate">{t.common.loading}</p>
        ) : keys.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-light px-4 py-4 text-body-md text-warm-slate">
            {t.profile.operatorApiKeysEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="rounded-lg border border-border-light bg-surface-container p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-label-md text-deep-navy">{key.label}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-label-sm text-teal-accent">
                        {key.keyPrefix}
                      </span>
                      {key.revokedAt && (
                        <span className="rounded-full bg-error-container px-2 py-1 text-label-sm text-on-error-container">
                          {t.profile.operatorApiKeysRevoked}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-label-sm text-warm-slate">
                      {t.profile.operatorApiKeysLastUsed}: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(key.id)}
                    disabled={Boolean(key.revokedAt) || revokingId === key.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-sm text-deep-navy disabled:opacity-60"
                  >
                    <Icon name="delete" />
                    {revokingId === key.id ? t.common.pleaseWait : t.profile.operatorApiKeysRevoke}
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-label-sm text-warm-slate">{t.profile.operatorApiKeysScopesLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {key.scopes.map((scope) => (
                      <span key={scope} className="rounded-full bg-white px-3 py-1 text-label-sm text-deep-navy">
                        {scopeLabel(scope)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
