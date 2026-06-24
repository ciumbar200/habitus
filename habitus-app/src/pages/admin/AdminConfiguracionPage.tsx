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
import { Link } from "react-router-dom";
import { LoadingState } from "../../components/PageState";
import { Icon } from "../../components/Icon";
import { AdminPageShell, AdminSection } from "../../components/admin/AdminPageShell";
import {
  AdminDataTable,
  AdminTableBody,
  AdminTableHead,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "../../components/admin/AdminDataTable";

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

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke(key: AdminApiKeyRow) {
    if (busyId) return;
    setBusyId(key.id);
    const err = await adminRevokeApiKey(key.id);
    if (err) setError(err);
    else setKeys((prev) => prev.map((k) => (k.id === key.id ? { ...k, revokedAt: new Date().toISOString() } : k)));
    setBusyId(null);
  }

  const active = keys.filter((k) => !k.revokedAt);

  return (
    <AdminSection
      title="API Keys de operadores"
      description="Claves generadas por operadores y agencias. Para Stripe e IA, usa Integraciones."
    >
      {error && <p className="mb-3 text-body-sm text-error">{error}</p>}
      {loading ? (
        <LoadingState />
      ) : active.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay claves activas.</p>
      ) : (
        <AdminDataTable minWidth="720px">
          <AdminTableHead>
            <AdminTableTh>Operador</AdminTableTh>
            <AdminTableTh>Etiqueta</AdminTableTh>
            <AdminTableTh>Prefijo</AdminTableTh>
            <AdminTableTh>Scopes</AdminTableTh>
            <AdminTableTh>Último uso</AdminTableTh>
            <AdminTableTh />
          </AdminTableHead>
          <AdminTableBody>
            {active.map((key) => (
              <AdminTableRow key={key.id}>
                <AdminTableTd className="font-medium">{key.profileName}</AdminTableTd>
                <AdminTableTd className="text-warm-slate">{key.label}</AdminTableTd>
                <AdminTableTd className="font-mono text-[11px] text-warm-slate">{key.keyPrefix}…</AdminTableTd>
                <AdminTableTd className="text-[11px] text-warm-slate">{key.scopes.join(", ")}</AdminTableTd>
                <AdminTableTd className="text-[11px] text-warm-slate">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("es-ES") : "Nunca"}
                </AdminTableTd>
                <AdminTableTd>
                  <button
                    type="button"
                    disabled={busyId === key.id}
                    onClick={() => void handleRevoke(key)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Revocar
                  </button>
                </AdminTableTd>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminDataTable>
      )}
    </AdminSection>
  );
}

function BlogSection() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminBlogPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  async function handleToggle(post: AdminBlogPost) {
    if (busyId) return;
    setBusyId(post.id);
    await adminToggleBlogPost(post.id, !post.isPublished);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: !p.isPublished } : p)));
    setBusyId(null);
  }

  return (
    <AdminSection title="Blog" description="Publicar o despublicar artículos del blog.">
      {loading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay artículos.</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-deep-navy">{post.title}</p>
                <p className="text-label-sm text-warm-slate">
                  /{post.slug} · {new Date(post.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === post.id}
                onClick={() => void handleToggle(post)}
                className={`rounded-full px-3 py-1.5 text-label-sm font-medium ${
                  post.isPublished ? "bg-teal-accent/10 text-teal-accent" : "border border-border-light text-warm-slate"
                }`}
              >
                {post.isPublished ? "Publicado" : "Borrador"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}

function EventsSection() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  async function handleToggle(ev: AdminEvent) {
    if (busyId) return;
    setBusyId(ev.id);
    await adminToggleEvent(ev.id, !ev.isPublished);
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, isPublished: !e.isPublished } : e)));
    setBusyId(null);
  }

  return (
    <AdminSection title="Eventos" description="Publicar o despublicar eventos de comunidad.">
      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay eventos.</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-deep-navy">{ev.title}</p>
                <p className="text-label-sm text-warm-slate">
                  {new Date(ev.startsAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === ev.id}
                onClick={() => void handleToggle(ev)}
                className={`rounded-full px-3 py-1.5 text-label-sm font-medium ${
                  ev.isPublished ? "bg-teal-accent/10 text-teal-accent" : "border border-border-light text-warm-slate"
                }`}
              >
                {ev.isPublished ? "Publicado" : "Oculto"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}

export function AdminConfiguracionPage() {
  return (
    <AdminPageShell
      title={es.admin.configTitle}
      subtitle={es.admin.configEditorialSubtitle}
      actions={
        <Link
          to="/admin/integraciones"
          className="inline-flex items-center gap-2 rounded-xl bg-deep-navy px-4 py-2 text-label-sm font-medium text-on-primary shadow-sm hover:opacity-90"
        >
          <Icon name="tune" className="text-[18px]" />
          {es.admin.nav.integrations}
        </Link>
      }
    >
      <div className="space-y-6">
        <ApiKeysSection />
        <BlogSection />
        <EventsSection />
      </div>
    </AdminPageShell>
  );
}
