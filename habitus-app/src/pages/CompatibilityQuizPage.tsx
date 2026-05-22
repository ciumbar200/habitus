import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  es,
  fetchCompatQuiz,
  homePathForRole,
  questionsForRole,
  profileNeedsCompatQuiz,
  saveCompatQuiz,
  type CompatQuizAnswers,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/PageState";

export function CompatibilityQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const { user, profile, loading, profileReady, quizComplete, refreshProfile, markQuizComplete } =
    useAuth();
  const [answers, setAnswers] = useState<CompatQuizAnswers>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = profile?.accountRole;

  useEffect(() => {
    if (!user?.id) return;
    fetchCompatQuiz(user.id)
      .then((q) => {
        setAnswers(q);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.id]);

  if (loading || !profileReady || !loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }
  if (!user) return <Navigate to="/access" replace />;
  if (!role || !profileNeedsCompatQuiz(profile)) {
    return <Navigate to={homePathForRole(role ?? profile?.accountRole)} replace />;
  }
  if (quizComplete && !editMode) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  const questions = questionsForRole(role);
  const quizSubtitle =
    role === "anfitrion"
      ? es.compat.quizSubtitleAnfitrion
      : es.compat.quizSubtitleInquilino;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !role) return;
    setBusy(true);
    setError(null);
    const result = await saveCompatQuiz(user.id, answers, role);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    markQuizComplete();
    await refreshProfile();
    const dest = editMode ? "/profile/editar" : homePathForRole(role);
    navigate(dest, { replace: true, state: editMode ? undefined : { fromQuizSave: true } });
  }

  return (
    <main className="mx-auto max-w-lg px-margin-mobile pb-12 pt-24 md:px-margin-desktop">
      <h1 className="text-headline-lg text-deep-navy">{es.compat.quizTitle}</h1>
      <p className="mt-2 text-body-md text-warm-slate">{quizSubtitle}</p>
      {questions.length === 0 && (
        <p className="mt-4 text-label-sm text-warm-slate">{es.compat.roleNotSupported}</p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
        {questions.map((q) => (
          <fieldset key={q.id}>
            <legend className="mb-2 text-label-md text-deep-navy">{q.label}</legend>
            {q.hint && <p className="mb-3 text-label-sm text-warm-slate">{q.hint}</p>}
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                    answers[q.id] === opt.value
                      ? "border-teal-accent bg-teal-accent/5"
                      : "border-border-light bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.value}
                    checked={answers[q.id] === opt.value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                    className="mt-1"
                    required
                  />
                  <span className="text-body-md text-deep-navy">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-deep-navy py-4 text-label-md text-white disabled:opacity-60"
        >
          {busy ? es.common.pleaseWait : es.compat.saveQuiz}
        </button>
      </form>
    </main>
  );
}
