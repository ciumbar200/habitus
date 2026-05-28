import { useCallback, useEffect, useState } from "react";
import {
  createAdminIntroduction,
  es,
  fetchAdminIntroductions,
  fetchAdminUsersExtended,
  fetchAdminListings,
  type AdminIntroduction,
  type AdminUserExtended,
  type AdminListingRow,
} from "@habitus/core";
import { Icon } from "../../components/Icon";
import { LoadingState } from "../../components/PageState";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABELS = es.admin.matchingStatus;

export function AdminMatchingPage() {
  const { user: adminUser } = useAuth();
  const [introductions, setIntroductions] = useState<AdminIntroduction[]>([]);
  const [users, setUsers] = useState<AdminUserExtended[]>([]);
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAdminIntroductions(),
      fetchAdminUsersExtended(),
      fetchAdminListings(),
    ])
      .then(([intros, usrs, lsts]) => {
        setIntroductions(intros);
        setUsers(usrs.filter((u) => u.accountRole === "inquilino" && !u.deletedAt));
        setListings(lsts.filter((l) => l.status === "published"));
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const filteredListings = listings.filter((l) => {
    const q = listingSearch.toLowerCase();
    return !q || l.name.toLowerCase().includes(q) || (l.city ?? "").toLowerCase().includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || !selectedListingId || !adminUser?.id || submitting) return;
    setSubmitting(true);
    setError(null);
    const { id, error: err } = await createAdminIntroduction({
      adminId: adminUser.id,
      profileId: selectedUserId,
      listingId: selectedListingId,
      internalNotes: notes || undefined,
      notify,
    });
    if (err) {
      setError(err);
    } else {
      setFeedback(`Introducción creada (${id.slice(0, 8)}…). ${notify ? "Usuario notificado." : ""}`);
      setTimeout(() => setFeedback(null), 4000);
      setShowForm(false);
      setSelectedUserId("");
      setSelectedListingId("");
      setNotes("");
      load();
    }
    setSubmitting(false);
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedListing = listings.find((l) => l.id === selectedListingId);

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg text-deep-navy">{es.admin.matchingTitle}</h1>
          <p className="mt-2 text-body-lg text-warm-slate">{es.admin.matchingSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary"
        >
          <Icon name="add" className="text-[18px]" />
          {es.admin.matchingNewIntro}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}
      {feedback && (
        <p className="mt-4 rounded-lg bg-teal-accent/10 px-4 py-2 text-body-sm text-teal-accent">{feedback}</p>
      )}

      {/* Formulario nueva introducción */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-teal-accent/30 bg-surface-container-lowest p-6 card-shadow"
        >
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.admin.matchingNewIntro}</h2>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-sm text-warm-slate">Inquilino</label>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={es.admin.matchingSelectUser}
                className="mb-2 w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
              />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
                size={4}
              >
                <option value="">— seleccionar —</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.city ?? "sin ciudad"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-label-sm text-warm-slate">Espacio</label>
              <input
                type="search"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder={es.admin.matchingSelectListing}
                className="mb-2 w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
              />
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
                size={4}
              >
                <option value="">— seleccionar —</option>
                {filteredListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.city ?? "?"} · {l.priceMonthly}€
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedUser && selectedListing && (
            <div className="mb-4 rounded-lg bg-teal-accent/10 px-4 py-3 text-body-sm text-teal-accent">
              Match: <strong>{selectedUser.displayName}</strong> → <strong>{selectedListing.name}</strong>
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-label-sm text-warm-slate">{es.admin.matchingNotes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Motivación del match, contexto adicional…"
              className="w-full rounded-lg border border-border-light px-3 py-2 text-label-sm"
            />
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-label-sm text-deep-navy">
              <input
                type="radio"
                checked={notify}
                onChange={() => setNotify(true)}
                className="h-4 w-4"
              />
              {es.admin.matchingPropose}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-label-sm text-deep-navy">
              <input
                type="radio"
                checked={!notify}
                onChange={() => setNotify(false)}
                className="h-4 w-4"
              />
              {es.admin.matchingProposeQuiet}
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !selectedUserId || !selectedListingId}
              className="rounded-lg bg-deep-navy px-5 py-2 text-label-md text-on-primary disabled:opacity-50"
            >
              {submitting ? "Creando…" : es.admin.matchingConfirm}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border-light px-5 py-2 text-label-md text-deep-navy"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Historial */}
      <h2 className="mb-3 mt-8 text-headline-md text-deep-navy">{es.admin.matchingHistory}</h2>
      {introductions.length === 0 ? (
        <p className="text-body-sm text-warm-slate">No hay introducciones todavía.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[700px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="px-4 py-3 text-label-md text-deep-navy">Inquilino</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Espacio</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Score</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {introductions.map((intro) => (
                <tr key={intro.id} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3 text-deep-navy">{intro.profileName ?? intro.profileId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-warm-slate">{intro.listingName ?? intro.listingId?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-3 text-warm-slate">
                    {intro.compatibilityScore != null ? `${intro.compatibilityScore}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={intro.status} />
                  </td>
                  <td className="px-4 py-3 text-warm-slate">
                    {new Date(intro.createdAt).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminIntroduction["status"] }) {
  const colors: Record<AdminIntroduction["status"], string> = {
    proposed:  "bg-surface-container text-warm-slate",
    notified:  "bg-blue-50 text-blue-700",
    accepted:  "bg-teal-accent/10 text-teal-accent",
    rejected:  "bg-error-container/30 text-error",
    expired:   "bg-amber-50 text-amber-700",
  };
  const labels = STATUS_LABELS;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
