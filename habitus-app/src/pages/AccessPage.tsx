import { useEffect, useState } from "react";
import { loadRememberedEmail, saveRememberMe } from "../lib/rememberMe";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  isPropertyReturnPath,
  parseGroupSlugParam,
  parseReferralCode,
  persistPendingGroupSlug,
  persistPendingReferral,
} from "@habitus/core";
import { saveReturnTo, redirectAfterAuth } from "../lib/returnTo";
import { accessWantsSignup, parseAccessRole } from "../lib/accessLinks";
import { Icon } from "../components/Icon";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { AuthShell } from "../components/auth/AuthShell";
import { AuthModeTabs } from "../components/auth/AuthModeTabs";
import { useAuth } from "../context/AuthContext";
import { es, ACCOUNT_ROLES } from "@habitus/core";
import type { AccountRoleSlug, OAuthProvider } from "@habitus/core";
import { signInWithOAuth } from "../lib/oauth";

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
  const [consentAccepted, setConsentAccepted] = useState(false);

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

    const ref = parseReferralCode(searchParams);
    if (ref) persistPendingReferral(ref);
    const grupo = parseGroupSlugParam(searchParams);
    if (grupo) {
      persistPendingGroupSlug(grupo);
      if (!roleFromUrl) setAccountRole("inquilino");
    }
  }, [fromPath, location.state, searchParams]);

  const handleModeChange = (next: "signin" | "signup") => {
    setMode(next);
    setError(null);
    if (next === "signin") setAccountRole("");
  };

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

    if (mode === "signup" && !consentAccepted) {
      setError(es.access.signupConsentRequired);
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
    <AuthShell
      title={mode === "signin" ? es.access.welcomeBack : es.access.createAccount}
      subtitle={mode === "signin" ? es.access.signInSubtitle : es.access.joinSubtitle}
    >
      <AuthModeTabs
        mode={mode}
        onChange={handleModeChange}
        signInLabel={es.common.signIn}
        signUpLabel={es.access.signUp}
      />

      {fromPath && isPropertyReturnPath(fromPath) && (
        <p className="auth-hint mb-5">{es.access.propertySignupHint}</p>
      )}

      {error && <p className="auth-error mb-5">{error}</p>}

      <SocialAuthButtons disabled={loading} onProvider={handleOAuth} />

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200/90" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-stone-100 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            {es.access.orEmail}
          </span>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit}
        aria-label={mode === "signin" ? es.common.signIn : es.access.createAccount}
        name={mode === "signin" ? "login" : "signup"}
      >
        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="name" className="auth-label">
                {es.common.fullName}
              </label>
              <input
                id="name"
                name="name"
                data-testid="input-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
              />
            </div>

            <fieldset>
              <legend className="auth-label">
                {es.common.role}
                <span className="ml-1 text-red-500">*</span>
              </legend>
              <p className="mb-3 text-[13px] leading-relaxed text-stone-500">
                {es.access.accountRoleHint}
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ACCOUNT_ROLES.map((role) => {
                  const selected = accountRole === role.slug;
                  return (
                    <label
                      key={role.slug}
                      data-testid={`role-option-${role.slug}`}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-all ${
                        selected
                          ? "border-stone-900 bg-stone-900 shadow-md"
                          : "border-stone-200/80 bg-white hover:border-stone-300 hover:shadow-sm"
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
                          selected ? "bg-white/10 text-teal-accent" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <Icon name={role.icon} className="text-[20px]" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[14px] font-semibold ${
                            selected ? "text-white" : "text-stone-900"
                          }`}
                        >
                          {role.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-[12px] leading-snug ${
                            selected ? "text-stone-300" : "text-stone-500"
                          }`}
                        >
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
          <label htmlFor="email" className="auth-label">
            {es.common.email}
          </label>
          <input
            id="email"
            name="email"
            data-testid="input-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            className="auth-input"
          />
        </div>

        {mode === "signin" && (
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20"
            />
            <span className="text-[14px] text-stone-600">{es.common.rememberMe}</span>
          </label>
        )}

        <div>
          <label htmlFor="password" className="auth-label">
            {es.common.password}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              data-testid="input-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 text-stone-400 transition-colors hover:text-stone-700"
              aria-label={showPassword ? es.access.hidePassword : es.access.showPassword}
            >
              <Icon name="visibility" className="text-[20px]" />
            </button>
          </div>
          {mode === "signin" && (
            <p className="mt-2.5 text-right">
              <Link
                to="/olvide-contrasena"
                className="text-[13px] font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                {es.common.forgotPassword}
              </Link>
            </p>
          )}
        </div>

        {mode === "signup" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-4">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20"
              required
            />
            <span className="text-[13px] leading-relaxed text-stone-600">
              {es.access.signupConsent}{" "}
              <Link to="/privacidad" className="font-medium text-stone-900 underline-offset-2 hover:underline">
                {es.legal.privacy}
              </Link>
              {" · "}
              <Link to="/terminos" className="font-medium text-stone-900 underline-offset-2 hover:underline">
                {es.legal.terms}
              </Link>
            </span>
          </label>
        )}

        <button
          type="submit"
          data-testid="access-submit"
          disabled={loading || (mode === "signup" && !accountRole)}
          className="auth-btn-primary"
        >
          {loading
            ? es.common.pleaseWait
            : mode === "signin"
              ? es.common.signIn
              : es.access.signUp}
          {!loading && <Icon name="arrow_forward" className="text-[18px]" />}
        </button>
      </form>
    </AuthShell>
  );
}
