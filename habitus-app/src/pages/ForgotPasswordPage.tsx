import { useState } from "react";
import { Link } from "react-router-dom";
import { es, requestPasswordReset } from "@habitus/core";
import { AuthShell } from "../components/auth/AuthShell";
import { Icon } from "../components/Icon";

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
    <AuthShell
      title={es.access.forgotTitle}
      subtitle={es.access.forgotSubtitle}
      backTo={{ href: "/access", label: `${es.common.back} — ${es.access.signInLink}` }}
    >
      {sent ? (
        <div className="auth-hint flex gap-3">
          <Icon name="check_circle" className="mt-0.5 shrink-0 text-[22px] text-teal-accent" />
          <p className="text-[15px] leading-relaxed text-stone-700">{es.access.forgotSent}</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}

          <div>
            <label htmlFor="forgot-email" className="auth-label">
              {es.common.email}
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="auth-input"
            />
          </div>

          <button type="submit" disabled={busy} className="auth-btn-primary">
            {busy ? es.common.pleaseWait : es.access.forgotSubmit}
          </button>
        </form>
      )}

      {sent && (
        <Link
          to="/access"
          className="auth-btn-primary mt-6 inline-flex no-underline"
        >
          {es.access.signInLink}
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
      )}
    </AuthShell>
  );
}
