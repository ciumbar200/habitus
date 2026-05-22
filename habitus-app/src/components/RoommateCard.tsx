import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { startConversationWith } from "@habitus/core";
import type { Roommate } from "@habitus/core";
import { Icon } from "./Icon";
import { CompatibilityScore } from "./CompatibilityScore";

type RoommateCardProps = {
  roommate: Roommate;
  isSaved?: boolean;
  onToggleBookmark?: (slug: string, uuid?: string) => void;
  onConversationStarted?: (conversationId: string) => void;
};

export function RoommateCard({
  roommate,
  isSaved,
  onToggleBookmark,
  onConversationStarted,
}: RoommateCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatLoading, setChatLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const handleBookmark = () => {
    if (onToggleBookmark) {
      onToggleBookmark(roommate.slug, roommate.uuid);
    } else {
      navigate("/access");
    }
  };

  const handleChat = async () => {
    if (!user) {
      navigate("/access");
      return;
    }

    if (roommate.isDemo) {
      setHint(es.matches.demoChatHint);
      return;
    }

    const otherId = roommate.uuid ?? roommate.id;
    setChatLoading(true);
    setHint(null);
    try {
      const convId = await startConversationWith(otherId);
      onConversationStarted?.(convId);
      navigate(`/messages?c=${convId}`);
    } catch {
      setHint("No se pudo iniciar la conversación. Inténtalo de nuevo.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest card-shadow transition-all duration-300 hover:shadow-lg">
      <div className="relative h-72 overflow-hidden">
        <img
          src={roommate.image}
          alt={roommate.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 max-w-[calc(100%-4rem)]">
          <CompatibilityScore
            score={roommate.compatibility}
            result={roommate.compatibilityResult}
            label={es.common.vibeMatch}
            variant="gradient"
            stopPropagation
          />
        </div>
        {roommate.isDemo && (
          <span className="absolute top-4 right-14 rounded-full bg-surface/90 px-2 py-0.5 text-label-sm text-warm-slate backdrop-blur-md">
            {es.matches.demoProfile}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-headline-md text-deep-navy">{roommate.name}</h3>
            <p className="text-label-md text-teal-accent">{roommate.role}</p>
          </div>
          {roommate.isDemo && onToggleBookmark && (
            <button
              type="button"
              onClick={handleBookmark}
              aria-label={isSaved ? es.common.saved : es.common.save}
              className={`cursor-pointer transition-colors ${
                isSaved ? "text-teal-accent" : "text-warm-slate hover:text-teal-accent"
              }`}
            >
              <Icon name="bookmark" filled={isSaved} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col space-y-4">
          <div className="flex flex-wrap gap-2">
            {roommate.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-surface-container px-3 py-1 text-label-sm text-deep-navy"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="line-clamp-2 text-body-md italic text-warm-slate">
            &ldquo;{roommate.quote}&rdquo;
          </p>
        </div>

        {hint && (
          <p className="mt-3 rounded-lg bg-surface-container px-3 py-2 text-label-sm text-warm-slate">
            {hint}
          </p>
        )}

        <div className="mt-auto flex gap-3 border-t border-border-light pt-6">
          <button
            type="button"
            disabled={chatLoading}
            onClick={handleChat}
            className="flex-1 rounded-lg bg-deep-navy py-3 text-label-md text-on-primary transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {chatLoading ? es.common.pleaseWait : es.matches.startChat}
          </button>
          <button
            type="button"
            aria-label={es.matches.viewProfile}
            onClick={() => navigate(`/miembro/${roommate.slug}`)}
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border-light transition-colors hover:bg-surface-container active:scale-95"
          >
            <Icon name="visibility" />
          </button>
        </div>
      </div>
    </article>
  );
}
