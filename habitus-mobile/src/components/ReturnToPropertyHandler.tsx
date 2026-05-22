import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { fetchCompatQuiz } from "@habitus/core";
import { consumeReturnTo, peekReturnTo, redirectAfterAuth } from "../lib/returnTo";
import { propertySlugFromReturnPath } from "../lib/navigationReturn";
import { useAuth } from "../context/AuthContext";

type TabNav = NavigationProp<Record<string, object | undefined>>;

/** Tras completar el funnel, abre la propiedad guardada en Discover. */
export function ReturnToPropertyHandler() {
  const navigation = useNavigation<TabNav>();
  const { user, profile } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (!user?.id || !profile?.accountRole || handled.current) return;

    let cancelled = false;

    (async () => {
      const pending = await peekReturnTo();
      const slug = propertySlugFromReturnPath(pending);
      if (!slug || cancelled) return;

      const quiz = await fetchCompatQuiz(user.id);
      const dest = await redirectAfterAuth(profile, quiz);
      if (cancelled || dest !== pending) return;

      handled.current = true;
      await consumeReturnTo();
      navigation.navigate("Discover", {
        screen: "PropertyDetail",
        params: { slug },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.accountRole, profile?.onboardingCompletedAt, navigation]);

  return null;
}
