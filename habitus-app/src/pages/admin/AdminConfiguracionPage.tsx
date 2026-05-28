import { useCallback, useEffect, useState } from "react";
import {
  adminRevokeApiKey,
  adminToggleBlogPost,
  adminToggleEvent,
  es,
  fetchAdminApiKeys,
  fetchAdminBlogPosts,
  fetchAdminEvents,
  type AdminApiKeyRow,
  type AdminBlogPost,
  type AdminEvent,
} from "@habitus/core";
import { LoadingState } from "../../components/PageState";
import { Icon } from "../../components/Icon";

// ─── API Keys section ─────────────────────────────────────────────────────────

function ApiKeysSection() {
  const [keys, setKeys] = useState<AdminApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminApiKeys()
      .then(setKeys)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(key: AdminApiKeyRow) {
    if (busyId) return;
    setBusyId(key.id);
    const err = await adminRevokeApiKey(key.id);
    if (err) setError(err);
    else setKeys((prev) => prev.map((k) => k.id === key.id ? { ...k, revokedAt: new Date().toISOString() } : k));
    setBusyId(null);
  }

  const active = keys.filter((k) => !k.revokedAt);
  const revoked = keys.filter((k) => k.revokedAt);

  return (
    <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <h2 className="mb-1 text-headline-md text-deep-navy">API Keys de operadores</h2>
      <p className="mb-4 text-body-sm text-warm-slate">Claves de acceso generadas por operadores y agencias.</p>
      {error && <p className="mb-3 text-body-sm text-error">{error}</p>}
      {loading ? <LoadingState /> : (
        <>
          {active.length === 0 ? (
            <p className="text-body-sm text-warm-slate">No hay claves activas.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-light">
              <table className="w-full text-left text-body-sm">
                <thead className="border-b border-border-light bg-surface-container">
                  <tr>
                    <th className="px-3 py-2 text-label-sm text-deep-navy">Operador</th>
                    <th className="px-3 py-2 text-label-sm text-deep-navy">Etiqueta</th>
                    <th className="px-3 py-2 text-label-sm text-deep-navy">Prefijo</th>
                    <th className="px-3 py-2 text-label-sm text-deep-navy">Scopes</th>
                    <th className="px-3 py-2 text-label-sm text-deep-navy">Último uso</th>
                    <th className="px-3 py-2 text-label-sm text-deep-navy" />
                  </tr>
                </thead>
                <tbody>
                  {active.map((key) => (
                    <tr key={key.id} className="border-b border-border-light last:border-0">
                      <td className="px-3 py-2 font-medium text-deep-navy">{key.profileName}</td>
                      <td className="px-3 py-2 text-warm-slate">{key.label}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-warm-slate">{key.keyPrefix}…</td>
                      <td className="px-3 py-2 text-[11px] text-warm-slate">{key.scopes.join(", ")}</td>
                      <td className="px-3 py-2 text-[11px] text-warm-slate">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("es-ES") : "Nunca"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={busyId === key.id}
                          onClick={() => handleRevoke(key)}
                          className="rounded border border-error/40 px-2 py-0.5 text-[11px] text-error hover:bg-error-container/20 disabled:opacity-50"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {revoked.length > 0 && (
            <p className="mt-2 text-[11px] text-warm-slate/60">{revoked.length} clave(s) revocada(s) no mostradas.</p>
          )}
        </>
      )}
    </section>
  );
}

// ─── Blog section ─────────────────────────────────────────────────────────────

function BlogSection() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminBlogPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(post: AdminBlogPost) {
    if (busyId) return;
    setBusyId(post.id);
    await adminToggleBlogPost(post.id, !post.isPublished);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, isPublished: !p.isPublished } : p));
    setBusyId(null);
  }

  return (
    <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <h2 className="mb-1 text-headline-md text-deep-navy">Blog</h2>
      <p className="mb-4 text-body-sm text-warm-slate">Publicar o despublicar artículos del blog.</p>
      {loading ? <LoadingState /> : posts.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay artículos.</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-label-md text-deep-navy">{post.title}</p>
                <p className="text-[11px] text-warm-slate">/{post.slug} · {new Date(post.createdAt).toLocaleDateString("es-ES")}</p>
              </div>
              <button
                type="button"
                disabled={busyId === post.id}
                onClick={() => handleToggle(post)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                  post.isPublished
                    ? "bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/20"
                    : "border border-border-light text-warm-slate hover:bg-surface-container"
                }`}
              >
                <Icon name={post.isPublished ? "visibility" : "visibility_off"} className="text-[14px]" />
                {post.isPublished ? "Publicado" : "Borrador"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Events section ───────────────────────────────────────────────────────────

function EventsSection() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(ev: AdminEvent) {
    if (busyId) return;
    setBusyId(ev.id);
    await adminToggleEvent(ev.id, !ev.isPublished);
    setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, isPublished: !e.isPublished } : e));
    setBusyId(null);
  }

  return (
    <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <h2 className="mb-1 text-headline-md text-deep-navy">Eventos</h2>
      <p className="mb-4 text-body-sm text-warm-slate">Publicar o despublicar eventos de comunidad.</p>
      {loading ? <LoadingState /> : events.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay eventos.</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-label-md text-deep-navy">{ev.title}</p>
                <p className="text-[11px] text-warm-slate">{new Date(ev.startsAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
              <button
                type="button"
                disabled={busyId === ev.id}
                onClick={() => handleToggle(ev)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                  ev.isPublished
                    ? "bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/20"
                    : "border border-border-light text-warm-slate hover:bg-surface-container"
                }`}
              >
                <Icon name={ev.isPublished ? "visibility" : "visibility_off"} className="text-[14px]" />
                {ev.isPublished ? "Publicado" : "Oculto"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-deep-navy">{es.admin.configTitle}</h1>
        <p className="mt-2 text-body-lg text-warm-slate">{es.admin.configSubtitle}</p>
      </div>
      <ApiKeysSection />
      <BlogSection />
      <EventsSection />
    </div>
  );
}
