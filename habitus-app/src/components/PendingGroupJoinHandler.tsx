import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  consumePendingGroupSlug,
  fetchGroupBySlug,
  peekPendingGroupSlug,
  requestJoinGroup,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";

/** Tras registro/login, completa solicitud de unión a grupo pendiente. */
export function PendingGroupJoinHandler() {
  const { user, profile, profileReady } = useAuth();
  const navigate = useNavigate();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profileReady || !user?.id) return;
    if (profile?.accountRole !== "inquilino") return;
    if (!profile.onboardingCompletedAt) return;

    const slug = peekPendingGroupSlug();
    if (!slug) return;
    if (handledRef.current === slug) return;

    void (async () => {
      try {
        const group = await fetchGroupBySlug(slug);
        if (!group) {
          consumePendingGroupSlug();
          return;
        }

        const err = await requestJoinGroup(group.id);
        if (!err) {
          consumePendingGroupSlug();
          handledRef.current = slug;
          navigate(`/grupos/${slug}`, { replace: true });
        }
      } catch {
        /* reintenta en próximo render si el slug sigue pendiente */
      }
    })();
  }, [user?.id, profile?.accountRole, profile?.onboardingCompletedAt, profileReady, navigate]);

  return null;
}
