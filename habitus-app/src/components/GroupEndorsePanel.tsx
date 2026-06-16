import { useEffect, useState } from "react";
import {
  submitEndorsement,
  hasEndorsed,
  type LivingGroupMember,
} from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type GroupEndorsePanelProps = {
  groupId: string;
  userId: string;
  members: LivingGroupMember[];
};

/**
 * Cierra el bucle del moat: tras convivir, un miembro valora a sus convivientes
 * (4 dimensiones + "¿repetirías?") -> submitEndorsement -> recalcula el Moon
 * Score del endosado (reputación portable). Es la pieza que hace crecer el foso.
 */
export function GroupEndorsePanel({ groupId, userId, members }: GroupEndorsePanelProps) {
  const t = useI18n();
  const others = members.filter((m) => m.profileId !== userId);

  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<string | null>(null);
  const [cleanliness, setCleanliness] = useState(5);
  const [respect, setRespect] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [payment, setPayment] = useState(5);
  const [wouldAgain, setWouldAgain] = useState(true);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(
      others.map((m) => hasEndorsed(userId, m.profileId).then((e) => (e ? m.profileId : null))),
    )
      .then((ids) => {
        if (active) setEndorsed(new Set(ids.filter(Boolean) as string[]));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, others.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    setError(null);
    setDone(false);
    const res = await submitEndorsement(userId, {
      endorseeId: target,
      convivenciaRef: groupId,
      cleanliness,
      respect,
      communication,
      payment,
      wouldLiveAgain: wouldAgain,
      comment: comment || undefined,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEndorsed((prev) => new Set(prev).add(target));
    setDone(true);
    setTarget(null);
    setComment("");
    setCleanliness(5);
    setRespect(5);
    setCommunication(5);
    setPayment(5);
    setWouldAgain(true);
  }

  if (others.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <h2 className="flex items-center gap-2 text-headline-md text-deep-navy">
        <Icon name="star_fill" className="text-[20px] text-teal-accent" />
        {t.endorse.title}
      </h2>
      <p className="mt-1 text-body-sm text-warm-slate">{t.endorse.subtitle}</p>

      {error && <p className="mt-3 text-label-sm text-red-600">{error}</p>}
      {done && (
        <p className="mt-3 rounded-lg bg-teal-accent/10 px-3 py-2 text-label-sm text-teal-accent">
          {t.endorse.done}
        </p>
      )}

      {target ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-lg border border-border-light p-4"
        >
          <p className="text-label-md text-deep-navy">
            {t.endorse.open}:{" "}
            <strong>{others.find((m) => m.profileId === target)?.displayName}</strong>
          </p>
          <SliderRow label={t.endorse.cleanliness} value={cleanliness} onChange={setCleanliness} />
          <SliderRow label={t.endorse.respect} value={respect} onChange={setRespect} />
          <SliderRow
            label={t.endorse.communication}
            value={communication}
            onChange={setCommunication}
          />
          <SliderRow label={t.endorse.payment} value={payment} onChange={setPayment} />
          <p className="text-label-xs text-warm-slate">{t.endorse.scaleHint}</p>

          <label className="flex items-center gap-2 text-label-md text-deep-navy">
            <input
              type="checkbox"
              checked={wouldAgain}
              onChange={(e) => setWouldAgain(e.target.checked)}
              className="h-4 w-4 accent-teal-accent"
            />
            {t.endorse.wouldLiveAgain}
          </label>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.endorse.commentLabel}
            rows={2}
            className="w-full rounded-lg border border-border-light px-3 py-2"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-teal-accent px-4 py-2 text-label-md text-on-primary disabled:opacity-60"
            >
              {busy ? t.common.pleaseWait : t.endorse.submit}
            </button>
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="rounded-lg px-4 py-2 text-label-md text-warm-slate hover:bg-surface-container"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <ul className="mt-4 space-y-2">
          {others.map((m) => (
            <li
              key={m.profileId}
              className="flex items-center justify-between rounded-lg border border-border-light px-3 py-2"
            >
              <span className="text-label-md text-deep-navy">{m.displayName}</span>
              {endorsed.has(m.profileId) ? (
                <span className="inline-flex items-center gap-1 text-label-sm text-teal-accent">
                  <Icon name="verified_user" className="text-[14px]" />
                  {t.endorse.alreadyEndorsed}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTarget(m.profileId)}
                  className="inline-flex items-center gap-1 rounded-lg bg-deep-navy px-3 py-1.5 text-label-sm text-on-primary"
                >
                  <Icon name="star_fill" className="text-[14px]" />
                  {t.endorse.open}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-label-sm text-deep-navy">
        <span>{label}</span>
        <span className="font-semibold text-teal-accent">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-accent"
      />
    </div>
  );
}
