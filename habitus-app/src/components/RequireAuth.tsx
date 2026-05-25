import { Navigate, useLocation } from "react-router-dom";
import {
  isValidReturnPath,
  profileNeedsOnboarding,
  profileNeedsCompatQuiz,
  profileNeedsProfileSetup,
  PROFILE_SETUP_PATH,
} from "@habitus/core";
import { saveReturnTo } from "../lib/returnTo";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "./PageState";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileReady, quizComplete } = useAuth();
  const location = useLocation();

  if (loading || (user && !profileReady)) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    if (isValidReturnPath(location.pathname)) saveReturnTo(location.pathname);
    return <Navigate to="/access" state={{ from: location.pathname }} replace />;
  }

  if (!profile?.accountRole) {
    return <Navigate to="/completar-rol" replace />;
  }

  if (profileNeedsOnboarding(profile) && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const fromQuizSave = (location.state as { fromQuizSave?: boolean } | null)?.fromQuizSave === true;

  const quizPending =
    profileNeedsCompatQuiz(profile) &&
    !quizComplete &&
    !fromQuizSave;

  if (quizPending && location.pathname !== "/cuestionario-compatibilidad") {
    return <Navigate to="/cuestionario-compatibilidad" replace />;
  }

  const inProfileSetup =
    location.pathname === "/profile/editar" &&
    (location.search.includes("setup=1") ||
      (location.state as { fromProfileSetup?: boolean } | null)?.fromProfileSetup === true);

  if (
    profileNeedsProfileSetup(profile) &&
    !inProfileSetup &&
    location.pathname !== "/profile/editar"
  ) {
    return <Navigate to={PROFILE_SETUP_PATH} replace />;
  }

  return <>{children}</>;
}
