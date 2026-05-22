import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LivingGroupCard } from "../components/LivingGroupCard";
import { IdentityBadge } from "../components/IdentityBadge";
import { Icon } from "../components/Icon";
import { PublishListingModal } from "../components/panel/PublishListingModal";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import {
  accountRoleLabel,
  applicationStatusClass,
  applicationStatusLabel,
  es,
  fetchApplications,
  fetchApplicationsToReview,
  fetchMyGroups,
  fetchPanelStats,
  formatAppliedDate,
  homePathForRole,
  listingCopyForRole,
  profileNeedsCompatQuiz,
} from "@habitus/core";
import type { Application, LivingGroup, ReviewApplication } from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, profileReady, quizComplete, signOut } = useAuth();
  const role = profile?.accountRole;

  const [applications, setApplications] = useState<Application[]>([]);
  const [incoming, setIncoming] = useState<ReviewApplication[]>([]);
  const [stats, setStats] = useState({ listings: 0, applications: 0, published: 0 });
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [identityNudgeDismissed, setIdentityNudgeDismissed] = useState(true);

  const isAdmin = profile?.isAdmin === true;
  const isManager = !isAdmin && (role === "anfitrion" || role === "propietario" || role === "agencia");
  const canPublish = !isAdmin && (role === "anfitrion" || role === "propietario" || role === "agencia");

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !profileReady || isAdmin) return;

    setLoading(true);
    setError(null);

    const tasks: Promise<void>[] = [];

    if (role === "inquilino") {
      tasks.push(
        fetchApplications(user.id)
          .then(setApplications)
          .catch((e) => {
            throw e;
          }),
        fetchMyGroups(user.id).then(setGroups),
      );
    } else if (isManager && role) {
      tasks.push(
        fetchPanelStats(user.id, role).then(setStats),
        fetchApplicationsToReview(user.id).then(setIncoming),
      );
    }

    Promise.all(tasks)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id, role, isManager, profileReady, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `habitus_identity_nudge_dismissed_${user.id}`;
    setIdentityNudgeDismissed(localStorage.getItem(key) === "1");
  }, [user?.id]);

  function dismissIdentityNudge() {
    if (!user?.id) return;
    localStorage.setItem(`habitus_identity_nudge_dismissed_${user.id}`, "1");
    setIdentityNudgeDismissed(true);
  }

  if (authLoading || !profileReady) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-12 text-center card-shadow">
          <h2 className="mb-2 text-headline-md text-deep-navy">{es.profile.signInTitle}</h2>
          <p className="mb-6 text-body-md text-warm-slate">{es.profile.signInHint}</p>
          <Link
            to="/access"
            className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary"
          >
            {es.common.signIn}
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </main>
    );
  }

  const score = profile?.profileScore ?? 0;
  const dashOffset = 351.85 - (351.85 * score) / 100;
  const firstName = profile?.displayName?.split(" ")[0] ?? es.profile.memberFallback;

  if (isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <section className="mb-stack-lg">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-2 block text-label-md uppercase tracking-wider text-teal-accent">
                Administración
              </span>
              <h2 className="text-display-lg text-deep-navy">
                Hola, {firstName}
              </h2>
              <p className="mt-2 text-body-lg text-warm-slate">
                Cuenta de administrador de la plataforma Habitus.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary"
              >
                <Icon name="admin_panel_settings" className="text-[20px]" />
                Ir al panel admin
              </Link>
              <Link
                to="/profile/editar"
                className="flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy transition-all hover:bg-surface-container"
              >
                <Icon name="edit" className="text-[20px]" />
                {es.profile.editProfile}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate("/", { replace: true });
                }}
                className="flex items-center gap-2 rounded-lg bg-surface-container px-6 py-3 text-label-md text-warm-slate"
              >
                {es.common.signOut}
              </button>
            </div>
          </div>
        </section>
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-8 card-shadow">
          <h3 className="mb-2 text-headline-md text-deep-navy">Gestión de la plataforma</h3>
          <p className="mb-6 text-body-md text-warm-slate">
            Desde el panel admin puedes revisar usuarios, espacios y reportes. No necesitas completar el cuestionario de compatibilidad.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/usuarios" className="rounded-lg border border-border-light px-5 py-2.5 text-label-md text-deep-navy">
              Usuarios
            </Link>
            <Link to="/admin/espacios" className="rounded-lg border border-border-light px-5 py-2.5 text-label-md text-deep-navy">
              Espacios
            </Link>
            <Link to="/admin/reportes" className="rounded-lg border border-border-light px-5 py-2.5 text-label-md text-deep-navy">
              Reportes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const copy = listingCopyForRole(role);

  const portalLabel = role === "anfitrion" ? es.profile.hostPortal : isManager ? es.profile.ownerPortal : es.profile.portal;
  const welcomeLine =
    role === "anfitrion"
      ? es.profile.hostWelcome
      : isManager
        ? es.profile.ownerPortal
        : es.profile.welcome;
  const progressLine =
    role === "anfitrion"
      ? es.profile.hostProgress.replace("{score}", String(score))
      : es.profile.progress.replace("{score}", String(score));

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      {!isAdmin &&
        profile?.identityStatus === "none" &&
        !identityNudgeDismissed && (
          <div className="mb-stack-md flex flex-col gap-3 rounded-xl border border-border-light bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between card-shadow">
            <p className="text-body-sm text-warm-slate">{es.profile.identityNudge}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/profile/editar"
                className="inline-flex items-center gap-1 rounded-lg border border-teal-accent px-4 py-2 text-label-sm text-teal-accent hover:bg-teal-accent/5"
              >
                {es.profile.identityNudgeCta}
              </Link>
              <button
                type="button"
                onClick={dismissIdentityNudge}
                className="rounded-lg px-4 py-2 text-label-sm text-warm-slate hover:bg-surface-container"
              >
                {es.common.skipForNow}
              </button>
            </div>
          </div>
        )}
      <section className="mb-stack-lg">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block text-label-md uppercase tracking-wider text-teal-accent">
              {portalLabel}
            </span>
            <h2 className="text-display-lg text-deep-navy">
              {welcomeLine}, {firstName}
            </h2>
            {profile?.accountRole && (
              <p className="mt-1 text-label-md text-teal-accent">
                {accountRoleLabel(profile.accountRole)}
              </p>
            )}
            <div className="mt-2">
              <IdentityBadge status={profile?.identityStatus ?? "none"} />
            </div>
            <p className="mt-2 text-body-lg text-warm-slate">{progressLine}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canPublish && (
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary"
              >
                <Icon name="add" className="text-[20px]" />
                {copy.publishCta}
              </button>
            )}
            <Link
              to="/profile/editar"
              className="flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy transition-all hover:bg-surface-container"
            >
              <Icon name="edit" className="text-[20px]" />
              {es.profile.editProfile}
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/", { replace: true });
              }}
              className="flex items-center gap-2 rounded-lg bg-surface-container px-6 py-3 text-label-md text-warm-slate"
            >
              {es.common.signOut}
            </button>
          </div>
        </div>
      </section>

      <div className="mb-stack-lg grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow md:col-span-8">
          {isManager ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-headline-md text-deep-navy">
                  {copy.incomingApplications}
                </h3>
                <Link to="/panel/solicitudes" className="text-label-sm text-teal-accent hover:underline">
                  {es.common.view}
                </Link>
              </div>
              {loading && <LoadingState message={es.common.loadingApplications} />}
              {error && <ErrorState message={error} />}
              {!loading && !error && incoming.length === 0 && (
                <p className="text-body-md text-warm-slate">{copy.noIncomingApplications}</p>
              )}
              <ul className="space-y-3">
                {incoming.slice(0, 5).map((app) => (
                  <li
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light p-4"
                  >
                    <div>
                      <p className="text-label-md text-deep-navy">{app.applicantName}</p>
                      <p className="text-label-sm text-warm-slate">{app.listingName}</p>
                      {app.appliedAt && (
                        <p className="text-label-sm text-outline">{formatAppliedDate(app.appliedAt)}</p>
                      )}
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-label-sm ${applicationStatusClass(app.status)}`}
                    >
                      {applicationStatusLabel(app.status)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={homePathForRole(role)}
                  className="rounded-lg bg-deep-navy px-5 py-2.5 text-label-md text-white"
                >
                  {es.profile.goToPanel}
                </Link>
                <Link
                  to="/panel/espacios"
                  className="rounded-lg border border-border-light px-5 py-2.5 text-label-md text-deep-navy"
                >
                  {copy.goToListings}
                </Link>
                {role === "anfitrion" && (
                  <Link
                    to="/panel/convivencia"
                    className="rounded-lg border border-border-light px-5 py-2.5 text-label-md text-deep-navy"
                  >
                    {es.profile.goToConvivencia}
                  </Link>
                )}
              </div>
              {!loading && !error && (
                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border-light pt-6">
                  <MiniStat label={copy.statsListings} value={stats.listings} />
                  <MiniStat label={es.panel.statsPublished} value={stats.published} />
                  <MiniStat label={es.panel.statsApplications} value={stats.applications} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-headline-md text-deep-navy">{es.profile.applications}</h3>
                <span className="text-label-sm text-warm-slate">
                  {applications.length} {es.profile.inProgress}
                </span>
              </div>

              {loading && <LoadingState message={es.common.loadingApplications} />}
              {error && <ErrorState message={error} />}

              {!loading && !error && applications.length === 0 && (
                <p className="text-body-md text-warm-slate">
                  {es.profile.noApplications}{" "}
                  <Link to="/descubrir" className="text-teal-accent hover:underline">
                    {es.common.exploreSpaces}
                  </Link>
                </p>
              )}

              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border-light p-4 transition-colors hover:border-teal-accent"
                  >
                    {app.propertyImage && (
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img src={app.propertyImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between gap-2">
                        <h4 className="text-label-md text-deep-navy">{app.propertyName}</h4>
                        <span className={`shrink-0 rounded px-2 py-1 text-label-sm ${app.statusClass}`}>
                          {app.status}
                        </span>
                      </div>
                      {app.date && (
                        <p className="mt-1 text-label-sm text-warm-slate">{app.date}</p>
                      )}
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
                        <div
                          className="h-full rounded-full bg-teal-accent"
                          style={{ width: `${app.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-deep-navy p-6 text-white md:col-span-4">
          <div>
            <h3 className="mb-2 text-headline-md">{es.profile.profileScore}</h3>
            <p className="text-label-md text-on-primary-container">{es.profile.scoreHint}</p>
          </div>
          <div className="relative flex justify-center py-8">
            <svg className="h-32 w-32 -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary-container"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="351.85"
                strokeDashoffset={dashOffset}
                className="text-teal-accent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-headline-md">{score}%</span>
            </div>
          </div>
          {profileNeedsCompatQuiz(profile) && (
            <Link
              to={
                quizComplete
                  ? "/cuestionario-compatibilidad?edit=1"
                  : "/cuestionario-compatibilidad"
              }
              className={`block w-full rounded-lg py-3 text-center font-bold text-label-md text-deep-navy ${
                quizComplete ? "bg-surface-container text-deep-navy" : "bg-teal-accent"
              }`}
            >
              {quizComplete ? es.profile.compatibilityQuiz : es.compat.startQuiz}
            </Link>
          )}
          {!quizComplete && profileNeedsCompatQuiz(profile) && (
            <p className="mt-2 text-center text-label-sm text-on-primary-container/90">
              {es.compat.quizRequiredHost}
            </p>
          )}
        </div>
      </div>

      {role === "inquilino" && (
        <section className="mb-stack-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-md text-deep-navy">{es.profile.myGroups}</h3>
            <Link to="/grupos" className="text-label-sm text-teal-accent hover:underline">
              {es.groups.viewGroup}
            </Link>
          </div>
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-light p-6 text-body-md text-warm-slate">
              {es.groups.empty}{" "}
              <Link to="/grupos/nuevo" className="text-teal-accent hover:underline">
                {es.groups.create}
              </Link>
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.slice(0, 4).map((g) => (
                <LivingGroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </section>
      )}

      {canPublish && (
        <PublishListingModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            if (user?.id && role) {
              fetchPanelStats(user.id, role).then(setStats).catch(() => {});
            }
          }}
        />
      )}
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-headline-md text-deep-navy">{value}</p>
      <p className="text-label-sm text-warm-slate">{label}</p>
    </div>
  );
}
