import { useState } from "react";
import {
  buildGroupInviteUrl,
  copyToClipboard,
  es,
  mailShareUrl,
  shareGroupInviteText,
  shareLink,
  whatsAppShareUrl,
} from "@habitus/core";
import { Icon } from "./Icon";

type ShareGroupButtonProps = {
  groupName: string;
  slug: string;
  variant?: "button" | "icon";
  className?: string;
};

export function ShareGroupButton({
  groupName,
  slug,
  variant = "button",
  className = "",
}: ShareGroupButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const url = buildGroupInviteUrl(slug);
  const text = shareGroupInviteText(groupName, url);

  async function handleShare() {
    const result = await shareLink({ title: groupName, text, url });
    if (result === "copied") setFeedback(es.groups.linkCopied);
    else if (result === "shared") setFeedback(null);
    else setFeedback(null);
    if (result === "copied") {
      setTimeout(() => setFeedback(null), 2500);
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    setFeedback(ok ? es.groups.linkCopied : null);
    if (ok) setTimeout(() => setFeedback(null), 2500);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={es.groups.shareGroup}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border-light hover:bg-surface-container ${className}`}
      >
        <Icon name="share" className="text-[20px]" />
      </button>
    );
  }

  return (
    <div className={className}>
      <p className="mb-3 text-body-sm text-warm-slate">{es.groups.shareCreated}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary"
        >
          <Icon name="share" className="text-[18px]" />
          {es.groups.shareGroup}
        </button>
        <a
          href={whatsAppShareUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
        >
          {es.groups.shareWhatsApp}
        </a>
        <a
          href={mailShareUrl(`Únete a ${groupName}`, text)}
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
        >
          {es.groups.shareEmail}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container"
        >
          {es.groups.copyLink}
        </button>
      </div>
      {feedback && <p className="mt-2 text-body-sm text-teal-accent">{feedback}</p>}
    </div>
  );
}
