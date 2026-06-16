import { useEffect, useState } from "react";
import {
  fetchGroupIncidents,
  createGroupIncident,
  updateIncidentStatus,
  type GroupIncident,
  type IncidentCategory,
  type IncidentSeverity,
  type IncidentStatus,
} from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type GroupIncidentsPanelProps = {
  groupId: string;
  userId: string;
};

const CATEGORIES: IncidentCategory[] = [
  "appliance",
  "plumbing",
  "electrical",
  "gas",
  "security",
  "cleanliness",
  "noise",
  "structural",
  "other",
];
const SEVERITIES: IncidentSeverity[] = ["low", "normal", "high", "urgent"];

const severityStyles: Record<IncidentSeverity, string> = {
  low: "bg-surface-container text-warm-slate border-border-light",
  normal: "bg-sky-100 text-sky-800 border-sky-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

const statusStyles: Record<IncidentStatus, string> = {
  open: "bg-red-100 text-red-800 border-red-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-teal-accent/15 text-teal-accent border-teal-accent/30",
  dismissed: "bg-surface-container text-warm-slate border-border-light",
};

export function GroupIncidentsPanel({ groupId, userId }: GroupIncidentsPanelProps) {
  const t = useI18n();
  const [incidents, setIncidents] = useState<GroupIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("appliance");
  const [severity, setSeverity] = useState<IncidentSeverity>("normal");
  const [description, setDescription] = useState("");

  async function reload() {
    setLoading(true);
    try {
      setIncidents(await fetchGroupIncidents(groupId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const err = await createGroupIncident({
      groupId,
      reportedBy: userId,
      title,
      category,
      severity,
      description,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setTitle("");
    setDescription("");
    setCategory("appliance");
    setSeverity("normal");
    setShowForm(false);
    await reload();
  }

  async function advance(incident: GroupIncident) {
    const next: IncidentStatus = incident.status === "open" ? "in_progress" : "resolved";
    const err = await updateIncidentStatus(incident.id, next);
    if (err) setError(err);
    else await reload();
  }

  const open = incidents.filter((i) => i.status !== "resolved" && i.status !== "dismissed");
  const closed = incidents.filter((i) => i.status === "resolved" || i.status === "dismissed");

  return (
    <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-headline-md text-deep-navy">
          <Icon name="warning" className="text-[20px] text-amber-700" />
          {t.incidents.title}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary"
        >
          <Icon name="add" className="text-[18px]" />
          {t.incidents.report}
        </button>
      </div>

      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-label-sm text-amber-800">
        {t.incidents.emergencyHint}
      </p>

      {error && <p className="mb-3 text-label-sm text-red-600">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-5 space-y-3 rounded-lg border border-border-light p-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.incidents.titleLabel}
            className="w-full rounded-lg border border-border-light px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="rounded-lg border border-border-light px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.incidents.categories[c]}
                </option>
              ))}
            </select>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="rounded-lg border border-border-light px-3 py-2"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {t.incidents.severities[s]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.incidents.descriptionLabel}
            rows={2}
            className="w-full rounded-lg border border-border-light px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-teal-accent px-4 py-2 text-label-md text-on-primary disabled:opacity-60"
            >
              {busy ? t.common.pleaseWait : t.incidents.submit}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-label-md text-warm-slate hover:bg-surface-container"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-label-sm text-warm-slate">{t.common.loading}</p>
      ) : incidents.length === 0 ? (
        <p className="text-label-sm text-warm-slate">{t.incidents.empty}</p>
      ) : (
        <ul className="space-y-2">
          {[...open, ...closed].map((inc) => (
            <li key={inc.id} className="rounded-lg border border-border-light p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${severityStyles[inc.severity]}`}
                >
                  {t.incidents.severities[inc.severity]}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${statusStyles[inc.status]}`}
                >
                  {t.incidents.statuses[inc.status]}
                </span>
                <span className="text-label-sm text-warm-slate">
                  {t.incidents.categories[inc.category]}
                </span>
                {inc.status !== "resolved" && inc.status !== "dismissed" && (
                  <button
                    type="button"
                    onClick={() => advance(inc)}
                    className="ml-auto text-label-sm text-teal-accent hover:underline"
                  >
                    {inc.status === "open" ? t.incidents.markInProgress : t.incidents.markResolved}
                  </button>
                )}
              </div>
              <p className="mt-1 font-medium text-deep-navy">{inc.title}</p>
              {inc.description && (
                <p className="text-label-sm text-warm-slate">{inc.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
