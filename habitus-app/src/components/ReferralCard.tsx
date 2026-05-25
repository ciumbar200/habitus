import { useEffect, useState } from "react";
import {
  buildReferralLinkForProfile,
  copyToClipboard,
  es,
  fetchReferralStats,
  mailShareUrl,
  shareLink,
  shareReferralText,
  whatsAppShareUrl,
  type ReferralStats,
} from "@habitus/core";
import { Icon } from "./Icon";

type ReferralCardProps = {
  profileId: string;
};

export function ReferralCard({ profileId }: ReferralCardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchReferralStats(profileId), buildReferralLinkForProfile(profileId)])
      .then(([s, link]) => {
        if (!mounted) return;
        setStats(s);
        setUrl(link?.url ?? null);
      })
      .catch(() => {
        if (mounted) {
          setStats(null);
          setLoadError(es.referrals.loadError);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [profileId]);

  if (loading) return null;

  if (loadError) {
    return (
      <section className="mb-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <p className="text-body-sm text-warm-slate">{loadError}</p>
      </section>
    );
  }

  const count = stats?.qualifiedCount ?? 0;
  const goal = stats?.goal ?? 5;
  const reached = count >= goal;
  const shareText = url ? shareReferralText(url) : "";

  async function handleShare() {
    if (!url) return;
    const result = await shareLink({
      title: es.referrals.title,
      text: shareText,
      url,
    });
    if (result === "copied") {
      setFeedback(es.referrals.linkCopied);
      setTimeout(() => setFeedback(null), 2500);
    }
  }

  async function handleCopy() {
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      setFeedback(es.referrals.linkCopied);
      setTimeout(() => setFeedback(null), 2500);
    }
  }

  return (
    <section className="mb-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-accent/15">
          <Icon name="redeem" className="text-[28px] text-teal-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-md text-deep-navy">{es.referrals.title}</h2>
          <p className="mt-1 text-body-sm text-warm-slate">{es.referrals.subtitle}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-label-sm text-deep-navy">
          <span>
            {count}/{goal} {es.referrals.progress}
          </span>
          <span>{Math.min(100, Math.round((count / goal) * 100))}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-teal-accent transition-all"
            style={{ width: `${Math.min(100, (count / goal) * 100)}%` }}
          />
        </div>
        {reached && (
          <p className="mt-3 text-body-sm font-medium text-teal-accent">{es.referrals.goalReached}</p>
        )}
      </div>

      {url && (
        <div className="mt-5">
          <p className="mb-2 text-label-md text-deep-navy">{es.referrals.yourLink}</p>
          <p className="mb-3 break-all rounded-lg bg-surface-container px-3 py-2 text-body-sm text-warm-slate">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary"
            >
              <Icon name="share" className="text-[18px]" />
              {es.referrals.share}
            </button>
            <a
              href={whatsAppShareUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
            >
              {es.groups.shareWhatsApp}
            </a>
            <a
              href={mailShareUrl(es.referrals.title, shareText)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
            >
              {es.groups.shareEmail}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
            >
              {es.referrals.copyLink}
            </button>
          </div>
          {feedback && <p className="mt-2 text-body-sm text-teal-accent">{feedback}</p>}
        </div>
      )}
    </section>
  );
}
