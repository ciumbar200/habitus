import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ageFromBirthDate,
  completeOnboarding,
  es,
  fetchCompatQuiz,
  isValidOnboardingAge,
  profileNeedsOnboarding,
} from "@habitus/core";
import { redirectAfterAuth } from "../lib/returnTo";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/PageState";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }
  if (!user) return <Navigate to="/access" replace />;
  if (!profileNeedsOnboarding(profile)) {
    return <Navigate to={redirectAfterAuth(profile, {})} replace />;
  }

  const agePreview = birthDate ? ageFromBirthDate(birthDate) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user?.id) return;

    if (!displayName.trim()) {
      setError(es.onboarding.nameRequired);
      return;
    }
    if (!birthDate) {
      setError(es.onboarding.birthRequired);
      return;
    }
    const age = ageFromBirthDate(birthDate);
    if (!isValidOnboardingAge(age)) {
      setError(es.onboarding.ageInvalid);
      return;
    }

    setBusy(true);
    const result = await completeOnboarding(user.id, { displayName, birthDate });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await refreshProfile();
    const quiz = await fetchCompatQuiz(user.id);
    const updated = {
      ...profile!,
      displayName: displayName.trim(),
      birthDate,
      onboardingCompletedAt: new Date().toISOString(),
    };
    navigate(redirectAfterAuth(updated, quiz), { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-margin-mobile pb-12 pt-24">
      <h1 className="text-headline-lg text-deep-navy">{es.onboarding.basicsTitle}</h1>
      <p className="mt-2 text-body-md text-warm-slate">{es.onboarding.basicsSubtitle}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayName" className="mb-2 block text-label-md text-deep-navy">
            {es.onboarding.fullName}
          </label>
          <input
            id="displayName"
            type="text"
            required
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={es.onboarding.fullNamePlaceholder}
            className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="mb-2 block text-label-md text-deep-navy">
            {es.onboarding.birthDate}
          </label>
          <input
            id="birthDate"
            type="date"
            required
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
          />
          <p className="mt-2 text-label-sm text-warm-slate">
            {es.onboarding.ageHint}
            {agePreview != null && ` · ${agePreview} años`}
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-deep-navy py-4 text-label-md text-white disabled:opacity-60"
        >
          {busy ? es.common.pleaseWait : es.onboarding.saveAndContinue}
        </button>
      </form>
    </main>
  );
}
