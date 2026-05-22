import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ensureProfileForAuthUser,
  es,
  fetchCompatQuiz,
  type AccountRoleSlug,
} from "@habitus/core";
import { redirectAfterAuth } from "../lib/returnTo";
import { LoadingState } from "../components/PageState";
import { consumePendingOAuthSignup } from "../lib/oauth";
import { supabase } from "../lib/supabase";

async function loadProfileForRedirect(userId: string) {
  const { data } = await supabase
    .from("habitus_profiles")
    .select(
      "id, display_name, avatar_url, profile_score, role_title, account_role, bio_quote, is_discoverable, is_admin, birth_date, onboarding_completed_at, identity_status",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileScore: data.profile_score,
    roleTitle: data.role_title,
    accountRole: data.account_role as AccountRoleSlug | null,
    bioQuote: data.bio_quote,
    isDiscoverable: data.is_discoverable ?? false,
    isAdmin: data.is_admin ?? false,
    identityStatus: (data.identity_status ?? "none") as "none" | "pending" | "verified",
    birthDate: data.birth_date,
    onboardingCompletedAt: data.onboarding_completed_at,
  };
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error_description") ?? params.get("error");
      if (authError) {
        if (!cancelled) setError(decodeURIComponent(authError));
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          if (!cancelled) setError(exchangeErr.message);
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.user) {
        if (!cancelled) setError(es.access.oauthError);
        return;
      }

      const pending = consumePendingOAuthSignup();
      const role = pending.accountRole as AccountRoleSlug | null;

      const sync = await ensureProfileForAuthUser(
        data.session.user,
        pending.isSignUp ? role : undefined,
      );
      if (sync.error) {
        if (!cancelled) setError(sync.error);
        return;
      }

      const profile = await loadProfileForRedirect(data.session.user.id);
      const quiz = await fetchCompatQuiz(data.session.user.id);
      if (!cancelled) {
        navigate(redirectAfterAuth(profile, quiz), { replace: true });
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      {error ? (
        <div className="max-w-md text-center">
          <p className="rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/access", { replace: true })}
            className="mt-6 text-label-md text-teal-accent hover:underline"
          >
            {es.common.back} — {es.access.signInLink}
          </button>
        </div>
      ) : (
        <LoadingState message={es.common.pleaseWait} />
      )}
    </main>
  );
}
