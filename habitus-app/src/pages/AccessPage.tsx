import { useEffect, useState } from "react";
import { loadRememberedEmail, saveRememberMe } from "../lib/rememberMe";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { isPropertyReturnPath } from "@habitus/core";
import { saveReturnTo } from "../lib/returnTo";
import { redirectAfterAuth } from "../lib/returnTo";
import { accessWantsSignup, parseAccessRole } from "../lib/accessLinks";
import { Icon } from "../components/Icon";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { ACCOUNT_ROLES } from "@habitus/core";
import type { AccountRoleSlug, OAuthProvider } from "@habitus/core";
import { signInWithOAuth } from "../lib/oauth";
import { Logo } from "../components/Logo";

type AccessLocationState = { from?: string; signup?: boolean };

export function AccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromPath = (location.state as AccessLocationState | null)?.from;
  const { signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountRole, setAccountRole] = useState<AccountRoleSlug | "">("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadRememberedEmail();
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const state = location.state as AccessLocationState | null;
    const roleFromUrl = parseAccessRole(searchParams.get("role"));
    const propertySignup = fromPath != null && isPropertyReturnPath(fromPath);
    const wantsSignup =
      accessWantsSignup(searchParams) || state?.signup === true || propertySignup;

    if (fromPath) saveReturnTo(fromPath);

    if (wantsSignup) setMode("signup");

    if (roleFromUrl) setAccountRole(roleFromUrl);
    else if (propertySignup || state?.signup) setAccountRole("inquilino");
  }, [fromPath, location.state, searchParams]);

  const handleOAuth = async (provider: OAuthProvider) => {
    setError(null);
    if (mode === "signup" && !accountRole) {
      setError(es.access.oauthRoleRequired);
      return;
    }
    setLoading(true);
    const { error: oauthErr } = await signInWithOAuth(provider, {
      isSignUp: mode === "signup",
      accountRole: accountRole || undefined,
    });
    setLoading(false);
    if (oauthErr) setError(oauthErr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && !accountRole) {
      setError(es.access.roleRequired);
      return;
    }

    if (mode === "signin") {
      saveRememberMe(email, rememberMe);
    }

    setLoading(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, name, accountRole as AccountRoleSlug);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate(
      result.redirect ?? (mode === "signup" ? "/onboarding" : redirectAfterAuth(null)),
      { replace: true },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-teal-accent/5 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[20%] h-[50%] w-[50%] rounded-full bg-primary-fixed-dim/10 blur-[120px]" />
      </div>

      <main className="grid min-h-[700px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-[0px_4px_40px_rgba(15,23,42,0.08)] md:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-deep-navy p-12 md:flex">
          <div className="absolute inset-0 opacity-40">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0YJr79J4tnvUTKOx2jAEeWIe2qmkTNtf9vMbyfrsIDZkVteGa89IcWEZDHgp7mbbivdd21SY2MWGCTWLmlkpsFt5XeEpAVChtWKgMgHWhNhDeL3kC3sxYYQBMKPvlqBcNNnB3Ho2BJHoBNu2nvOixyB57rCvuwZJYMP94jCrY4seUYLlz3cAMripCEHu_sN-CV0n1071DLutvVdC2RPdRfnH9GYkFb_sL_jo1Qp51P0AXHA_G6WWkV8iCAc74wqEuUAPRnpbLW0s"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/40 to-transparent" />
          <div className="relative z-10">
            <Logo variant="dark" height={48} />
            <p className="mt-4 max-w-sm text-body-lg text-on-primary-container">
              {es.access.tagline}
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center bg-surface-container-lowest p-8 md:p-16 lg:p-20">
          <div className="mb-10 text-center md:hidden">
            <Logo variant="light" height={40} className="mx-auto" />
          </div>

          <div className="mx-auto w-full max-w-md">
            <header className="mb-10">
              <h2 className="mb-2 text-headline-lg text-deep-navy">
                {mode === "signin" ? es.access.welcomeBack : es.access.createAccount}
              </h2>
              <p className="text-body-md text-warm-slate">
                {mode === "signin" ? es.access.signInSubtitle : es.access.joinSubtitle}
              </p>
            </header>

            {fromPath && isPropertyReturnPath(fromPath) && (
              <p className="mb-4 rounded-lg bg-primary-container px-4 py-3 text-label-sm text-on-primary-container">
                {es.access.propertySignupHint}
              </p>
            )}

            {error && (
              <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
                {error}
              </p>
            )}

            <SocialAuthButtons disabled={loading} onProvider={handleOAuth} />

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-container-lowest px-4 text-label-sm text-warm-slate">
                  {es.access.orEmail}
                </span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <div>
                    <label htmlFor="name" className="mb-2 block text-label-md text-deep-navy">
                      {es.common.fullName}
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md text-deep-navy focus:border-teal-accent focus:ring-2 focus:ring-teal-accent/20"
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-2 block text-label-md text-deep-navy">
                      {es.common.role}
                      <span className="ml-1 text-error">*</span>
                    </legend>
                    <p className="mb-3 text-label-sm text-warm-slate">{es.access.accountRoleHint}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ACCOUNT_ROLES.map((role) => {
                        const selected = accountRole === role.slug;
                        return (
                          <label
                            key={role.slug}
                            className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                              selected
                                ? "border-teal-accent bg-teal-accent/5 ring-2 ring-teal-accent/30"
                                : "border-border-light bg-white hover:border-teal-accent/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accountRole"
                              value={role.slug}
                              checked={selected}
                              onChange={() => setAccountRole(role.slug)}
                              className="sr-only"
                              required={!accountRole}
                            />
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                selected
                                  ? "bg-teal-accent text-white"
                                  : "bg-surface-container text-teal-accent"
                              }`}
                            >
                              <Icon name={role.icon} className="text-[22px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-label-md text-deep-navy">{role.label}</span>
                              <span className="block text-label-sm leading-snug text-warm-slate">
                                {role.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-label-md text-deep-navy">
                  {es.common.email}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md text-deep-navy focus:border-teal-accent focus:ring-2 focus:ring-teal-accent/20"
                />
              </div>
              {mode === "signin" && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border-light text-teal-accent focus:ring-teal-accent/20"
                  />
                  <span className="text-body-md text-warm-slate">{es.common.rememberMe}</span>
                </label>
              )}
              <div>
                <label htmlFor="password" className="mb-2 block text-label-md text-deep-navy">
                  {es.common.password}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md text-deep-navy focus:border-teal-accent focus:ring-2 focus:ring-teal-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-outline"
                    aria-label={showPassword ? es.access.hidePassword : es.access.showPassword}
                  >
                    <Icon name="visibility" className="text-[20px]" />
                  </button>
                </div>
                {mode === "signin" && (
                  <p className="mt-2 text-right">
                    <Link
                      to="/olvide-contrasena"
                      className="text-label-sm text-teal-accent hover:underline"
                    >
                      {es.common.forgotPassword}
                    </Link>
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || (mode === "signup" && !accountRole)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-deep-navy py-4 text-label-md text-white disabled:opacity-60"
              >
                {loading
                  ? es.common.pleaseWait
                  : mode === "signin"
                    ? es.common.signIn
                    : es.access.signUp}
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </form>

            <footer className="mt-10 text-center">
              <p className="text-body-md text-warm-slate">
                {mode === "signin" ? es.access.notMember : es.access.hasAccount}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                    setAccountRole("");
                  }}
                  className="text-label-md text-teal-accent hover:underline"
                >
                  {mode === "signin" ? es.access.createAccountLink : es.access.signInLink}
                </button>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
