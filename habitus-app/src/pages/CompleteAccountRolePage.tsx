import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/PageState";
import { fetchCompatQuiz } from "@habitus/core";
import { redirectAfterAuth } from "../lib/returnTo";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { ACCOUNT_ROLES } from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";

export function CompleteAccountRolePage() {
  const navigate = useNavigate();
  const { user, profile, loading, updateAccountRole } = useAuth();
  const [accountRole, setAccountRole] = useState<AccountRoleSlug | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !profile?.accountRole) return;
    fetchCompatQuiz(user.id).then((quiz) => {
      navigate(redirectAfterAuth(profile, quiz), { replace: true });
    });
  }, [user?.id, profile?.accountRole, profile, navigate]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/access" replace />;
  }

  if (profile?.accountRole) {
    return (
      <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24">
        <LoadingState />
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountRole) {
      setError(es.access.roleRequired);
      return;
    }
    setSaving(true);
    setError(null);
    const err = await updateAccountRole(accountRole);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    const quiz = await fetchCompatQuiz(user!.id);
    navigate(
      redirectAfterAuth(
        profile
          ? { ...profile, accountRole }
          : {
              id: user!.id,
              displayName: "",
              avatarUrl: null,
              profileScore: 0,
              roleTitle: null,
              accountRole,
              bioQuote: null,
              isDiscoverable: accountRole === "inquilino",
              isAdmin: false,
              identityStatus: "none",
              birthDate: null,
              onboardingCompletedAt: null,
            },
        quiz,
      ),
    );
  };

  return (
    <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="mb-2 text-headline-lg text-deep-navy">{es.access.completeRoleTitle}</h1>
      <p className="mb-8 text-body-md text-warm-slate">{es.access.accountRoleHint}</p>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {ACCOUNT_ROLES.map((role) => {
            const selected = accountRole === role.slug;
            return (
              <label
                key={role.slug}
                className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                  selected
                    ? "border-teal-accent bg-teal-accent/5 ring-2 ring-teal-accent/30"
                    : "border-border-light bg-surface-container-lowest"
                }`}
              >
                <input
                  type="radio"
                  name="accountRole"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setAccountRole(role.slug)}
                />
                <Icon name={role.icon} className="text-teal-accent" />
                <span>
                  <span className="block text-label-md text-deep-navy">{role.label}</span>
                  <span className="text-label-sm text-warm-slate">{role.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={saving || !accountRole}
          className="w-full rounded-lg bg-deep-navy py-4 text-label-md text-white disabled:opacity-60"
        >
          {saving ? es.common.pleaseWait : es.access.continue}
        </button>
      </form>
    </main>
  );
}
