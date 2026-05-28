import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { es, startConversationWith, type IdentityStatus } from "@habitus/core";
import type { Roommate } from "@habitus/core";
import { Icon } from "./Icon";
import { IdentityBadge } from "./IdentityBadge";

type SimpleTenantCardProps = {
  roommate: Roommate;
  onConversationStarted?: (conversationId: string) => void;
};

/**
 * Tarjeta simplificada para propietarios que ven inquilinos.
 * Muestra solo información esencial: nombre, foto y verificación de identidad.
 * NO muestra compatibilidad de estilos de vida (irrelevante para propietarios).
 */
export function SimpleTenantCard({
  roommate,
  onConversationStarted,
}: SimpleTenantCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatLoading, setChatLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

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

  const identityStatus: IdentityStatus | null =
    "identityStatus" in roommate && typeof roommate.identityStatus === "string"
      ? (roommate.identityStatus as IdentityStatus)
      : null;

  return (
    <article className="flex items-center gap-4 rounded-xl border border-border-light bg-surface-container-lowest p-4 card-shadow transition-all duration-300 hover:shadow-md">
      {/* Avatar */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
        <img
          src={roommate.image}
          alt={roommate.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-label-md font-semibold text-deep-navy truncate">
            {roommate.name}
          </h3>
          {identityStatus && <IdentityBadge status={identityStatus} size="sm" />}
        </div>
        <p className="text-label-sm text-warm-slate truncate">{roommate.role}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={es.matches.viewProfile}
          onClick={() => navigate(`/miembro/${roommate.slug}`)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light transition-colors hover:bg-surface-container active:scale-95"
          title="Ver perfil completo"
        >
          <Icon name="visibility" />
        </button>
        <button
          type="button"
          disabled={chatLoading}
          onClick={handleChat}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-deep-navy text-on-primary transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
          title="Enviar mensaje"
        >
          <Icon name="chat" />
        </button>
      </div>

      {hint && (
        <p className="col-span-full mt-2 rounded-lg bg-surface-container px-3 py-2 text-label-sm text-warm-slate">
          {hint}
        </p>
      )}
    </article>
  );
}
