import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  completeIdentityVerificationDemo,
  deleteOwnAccount,
  requestIdentityVerification,
  computeProfileScore,
  es,
  fetchProfileEditData,
  isQuizComplete,
  PROFILE_LIFESTYLE_TAGS,
  questionsForRole,
  roleNeedsCompatQuiz,
  roleShowsLifestyleProfile,
  roleShowsTrustProfile,
  updateProfile,
  type SearchCity,
  type SearchPrefs,
} from "@habitus/core";
import { AvatarUpload } from "../components/AvatarUpload";
import { IdentityBadge } from "../components/IdentityBadge";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";

function Section({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-light bg-surface-container-lowest p-stack-md card-shadow">
      <h2 className="text-headline-md text-deep-navy">{title}</h2>
      {hint && <p className="mt-1 text-body-md text-warm-slate">{hint}</p>}
      <div className="mt-stack-md space-y-4">{children}</div>
    </section>
  );
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const role = profile?.accountRole;

  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bioQuote, setBioQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [searchPrefs, setSearchPrefs] = useState<SearchPrefs>({
    city: "",
    budgetMax: null,
    moveIn: null,
    roomType: null,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const identityStatus = profile?.identityStatus ?? "none";

  useEffect(() => {
    if (!user?.id) return;
    fetchProfileEditData(user.id)
      .then((d) => {
        if (d) {
          setDisplayName(d.displayName);
          setRoleTitle(d.roleTitle ?? "");
          setBioQuote(d.bioQuote ?? "");
          setAvatarUrl(d.avatarUrl);
          setIsDiscoverable(d.isDiscoverable);
          setSearchPrefs(d.searchPrefs);
          setTags(d.tags);
          if (role && roleNeedsCompatQuiz(role)) {
            setQuizComplete(isQuizComplete(d.compatQuiz, role));
          }
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user?.id, role]);

  const previewScore = useMemo(
    () =>
      computeProfileScore(
        {
          displayName,
          roleTitle: roleTitle.trim() || null,
          bioQuote: bioQuote.trim() || null,
          avatarUrl,
          searchPrefs,
          tags,
        },
        role,
      ),
    [displayName, roleTitle, bioQuote, avatarUrl, searchPrefs, tags, role],
  );

  const dashOffset = 351.85 - (351.85 * previewScore) / 100;
  const isInquilino = role === "inquilino";
  const showLifestyle = roleShowsLifestyleProfile(role);
  const showTrust = roleShowsTrustProfile(role);
  const ep = es.editProfile;

  if (authLoading || !ready) {
    return (
      <main className="mx-auto max-w-3xl px-margin-mobile py-24">
        <LoadingState />
      </main>
    );
  }
  if (!user) return <Navigate to="/access" replace />;

  async function handleDeleteAccount() {
    if (!window.confirm(es.account.deleteAccountConfirm)) return;
    setDeleteBusy(true);
    setError(null);
    const { error: err } = await deleteOwnAccount();
    if (err) {
      setDeleteBusy(false);
      setError(err);
      return;
    }
    await signOut();
    navigate("/", { replace: true });
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 8 ? [...prev, tag] : prev,
    );
  }

  function setCity(city: SearchCity) {
    setSearchPrefs((p) => ({ ...p, city }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setBusy(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile(
      user.id,
      {
        displayName: displayName.trim(),
        roleTitle: roleTitle.trim() || null,
        bioQuote: bioQuote.trim() || null,
        avatarUrl,
        isDiscoverable: isInquilino ? isDiscoverable : undefined,
        searchPrefs: isInquilino ? searchPrefs : undefined,
        tags,
      },
      role ?? null,
    );

    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    await refreshProfile();
    window.setTimeout(() => navigate("/profile", { replace: true }), 800);
  }

  return (
    <main className="mx-auto max-w-3xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <div className="mb-stack-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/profile"
            className="mb-2 inline-flex items-center gap-1 text-label-md text-teal-accent hover:underline"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            {es.common.back}
          </Link>
          <h1 className="text-headline-lg text-deep-navy">{ep.title}</h1>
          <p className="mt-2 text-body-md text-warm-slate">
            {showTrust ? ep.publisherSubtitle : ep.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border-light bg-surface-container-lowest px-5 py-4 card-shadow">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="56" fill="none" stroke="#e8ecef" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="none"
              stroke="#2d6a5a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="351.85"
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div>
            <p className="text-label-sm uppercase tracking-wider text-warm-slate">{ep.previewScore}</p>
            <p className="text-display-sm text-deep-navy">{previewScore}%</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-teal-accent/10 px-4 py-3 text-label-sm text-teal-accent">
          {ep.saved}
        </p>
      )}

      <form className="space-y-stack-lg" onSubmit={handleSubmit}>
        <Section title={ep.avatar}>
          <AvatarUpload
            userId={user.id}
            value={avatarUrl}
            onChange={setAvatarUrl}
            displayName={displayName}
          />
        </Section>

        <Section title="Datos personales">
          <div>
            <label className="mb-2 block text-label-md text-deep-navy">{ep.displayName}</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
            />
          </div>
          <div>
            <label className="mb-2 block text-label-md text-deep-navy">{ep.professionalRole}</label>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Estudiante, diseñador/a, enfermería…"
              className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
            />
            <p className="mt-1 text-label-sm text-warm-slate">{ep.professionalRoleHint}</p>
          </div>
          <div>
            <label className="mb-2 block text-label-md text-deep-navy">{ep.bio}</label>
            <textarea
              rows={5}
              value={bioQuote}
              onChange={(e) => setBioQuote(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
            />
            <p className="mt-1 text-label-sm text-warm-slate">
              {bioQuote.trim().length} {ep.chars} ·{" "}
              {showTrust ? ep.publisherBioHint : ep.bioHint}
            </p>
          </div>
        </Section>

        {isInquilino && (
          <Section title={ep.searchSection} hint={ep.searchSectionHint}>
            <div>
              <span className="mb-2 block text-label-md text-deep-navy">{ep.preferredCity}</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["", ep.cityAny],
                    ["barcelona", ep.cityBarcelona],
                    ["madrid", ep.cityMadrid],
                    ["both", ep.cityBoth],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val || "any"}
                    type="button"
                    onClick={() => setCity(val)}
                    className={`rounded-full px-4 py-2 text-label-md transition-colors ${
                      searchPrefs.city === val
                        ? "bg-deep-navy text-white"
                        : "border border-border-light bg-white text-deep-navy hover:bg-surface-container"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-label-md text-deep-navy">{ep.budgetMax}</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={searchPrefs.budgetMax ?? ""}
                  onChange={(e) =>
                    setSearchPrefs((p) => ({
                      ...p,
                      budgetMax: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                  placeholder={ep.budgetPlaceholder}
                  className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
                />
              </div>
              <div>
                <label className="mb-2 block text-label-md text-deep-navy">{ep.moveIn}</label>
                <input
                  type="date"
                  value={searchPrefs.moveIn ?? ""}
                  onChange={(e) =>
                    setSearchPrefs((p) => ({ ...p, moveIn: e.target.value || null }))
                  }
                  className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-label-md text-deep-navy">{ep.roomType}</label>
              <input
                value={searchPrefs.roomType ?? ""}
                onChange={(e) =>
                  setSearchPrefs((p) => ({ ...p, roomType: e.target.value || null }))
                }
                placeholder={ep.roomTypePlaceholder}
                className="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-md"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-light bg-white p-4">
              <input
                type="checkbox"
                checked={isDiscoverable}
                onChange={(e) => setIsDiscoverable(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-label-md text-deep-navy">{ep.visibleInMatches}</span>
                <span className="text-label-sm text-warm-slate">{ep.visibleHint}</span>
              </span>
            </label>
          </Section>
        )}

        {showLifestyle && (
          <Section title={ep.lifestyleTags} hint={ep.lifestyleTagsHint}>
            <div className="flex flex-wrap gap-2">
              {PROFILE_LIFESTYLE_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-4 py-2 text-label-md transition-colors ${
                      active
                        ? "bg-teal-accent text-white"
                        : "border border-border-light bg-white text-deep-navy hover:border-teal-accent/40"
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {tag}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {(role === "inquilino" || role === "anfitrion" || showTrust) && (
          <Section
            title={
              <span className="inline-flex flex-wrap items-center gap-2">
                {showTrust ? ep.trustSection : es.identity.title}
                {identityStatus === "none" && (
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm font-normal text-warm-slate">
                    {es.common.optional}
                  </span>
                )}
              </span>
            }
            hint={showTrust ? ep.trustSectionHint : es.identity.subtitle}
          >
            <div className="flex flex-wrap items-center gap-3">
              <IdentityBadge status={identityStatus} />
              {identityStatus === "verified" && (
                <p className="text-body-sm text-warm-slate">{es.identity.verifiedHint}</p>
              )}
            </div>
            {identityStatus === "none" && (
              <p className="text-body-sm text-warm-slate">{es.identity.skipHint}</p>
            )}
            {identityStatus === "none" && (
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  disabled={identityBusy || !user?.id}
                  onClick={async () => {
                    if (!user?.id) return;
                    setIdentityBusy(true);
                    await requestIdentityVerification(user.id);
                    await refreshProfile();
                    setIdentityBusy(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-teal-accent px-5 py-3 text-label-md text-teal-accent transition-colors hover:bg-teal-accent/5 disabled:opacity-60"
                >
                  <Icon name="shield" />
                  {identityBusy ? es.common.pleaseWait : es.identity.startDemo}
                </button>
              </div>
            )}
            {identityStatus === "pending" && (
              <>
                <p className="text-body-sm text-warm-slate">{es.identity.pendingHint}</p>
                <button
                  type="button"
                  disabled={identityBusy || !user?.id}
                  onClick={async () => {
                    if (!user?.id) return;
                    setIdentityBusy(true);
                    await completeIdentityVerificationDemo(user.id);
                    await refreshProfile();
                    setIdentityBusy(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-on-primary disabled:opacity-60"
                >
                  <Icon name="verified_user" />
                  {identityBusy ? es.common.pleaseWait : es.identity.completeDemo}
                </button>
              </>
            )}
          </Section>
        )}

        {role && roleNeedsCompatQuiz(role) && (
          <Section title={ep.compatSection} hint={ep.compatSectionHint}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    quizComplete ? "bg-teal-accent/15 text-teal-accent" : "bg-surface-container text-warm-slate"
                  }`}
                >
                  <Icon name={quizComplete ? "check_circle" : "pending" } className="text-[28px]" />
                </div>
                <div>
                  <p className="text-label-md text-deep-navy">
                    {quizComplete ? ep.quizComplete : ep.quizIncomplete}
                  </p>
                  <p className="text-label-sm text-warm-slate">
                    {questionsForRole(role).length} preguntas · convivencia, horarios, presupuesto…
                  </p>
                </div>
              </div>
              <Link
                to="/cuestionario-compatibilidad?edit=1"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-light px-5 py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container"
              >
                <Icon name="edit" className="text-[18px]" />
                {ep.editQuiz}
              </Link>
            </div>
          </Section>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-deep-navy px-8 py-4 text-label-md text-white disabled:opacity-60 sm:flex-none"
          >
            <Icon name="save" className="text-[20px]" />
            {busy ? es.common.pleaseWait : es.common.save}
          </button>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-lg border border-border-light px-8 py-4 text-label-md text-deep-navy hover:bg-surface-container"
          >
            {es.common.cancel}
          </Link>
        </div>
      </form>

      <section className="mt-8 rounded-xl border border-error/30 bg-error-container/10 p-stack-md">
        <h2 className="text-headline-md text-error">{es.account.dangerZone}</h2>
        <p className="mt-2 text-body-md text-warm-slate">{es.account.deleteAccountHint}</p>
        <button
          type="button"
          disabled={deleteBusy}
          onClick={handleDeleteAccount}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-error px-6 py-3 text-label-md text-error transition-colors hover:bg-error-container/30 disabled:opacity-60"
        >
          <Icon name="person_remove" className="text-[20px]" />
          {deleteBusy ? es.common.pleaseWait : es.account.deleteAccount}
        </button>
      </section>
    </main>
  );
}
