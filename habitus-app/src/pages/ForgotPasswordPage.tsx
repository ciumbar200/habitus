import { useState } from "react";
import { Link } from "react-router-dom";
import { es, requestPasswordReset } from "@habitus/core";
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const redirectTo = `${window.location.origin}/access`;
    const { error: err } = await requestPasswordReset(email, redirectTo);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-headline-lg text-deep-navy">{es.access.forgotTitle}</h1>
      <p className="mt-2 text-body-md text-warm-slate">{es.access.forgotSubtitle}</p>

      {sent ? (
        <p className="mt-6 rounded-lg bg-primary-container px-4 py-3 text-body-md text-on-primary-container">
          {es.access.forgotSent}
        </p>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
              {error}
            </p>
          )}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={es.common.email}
            className="w-full rounded-lg border border-border-light px-4 py-3 text-body-md"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-deep-navy py-3 text-label-md text-white disabled:opacity-60"
          >
            {busy ? es.common.pleaseWait : es.access.forgotSubmit}
          </button>
        </form>
      )}

      <Link to="/access" className="mt-8 text-center text-label-md text-teal-accent hover:underline">
        {es.common.back} — {es.access.signInLink}
      </Link>
    </main>
  );
}
