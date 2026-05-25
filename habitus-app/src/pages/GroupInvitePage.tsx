import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  es,
  fetchPublicGroupPreview,
  requestJoinGroup,
  fetchGroupBySlug,
  persistPendingGroupSlug,
  type PublicGroupPreview,
} from "@habitus/core";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/Icon";

export function GroupInvitePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [preview, setPreview] = useState<PublicGroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPublicGroupPreview(slug)
      .then((p) => {
        if (!p) setError(es.groups.empty);
        else setPreview(p);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleJoin() {
    if (!slug || !preview) return;

    if (!user) {
      persistPendingGroupSlug(slug);
      navigate(`/access?signup=1&role=inquilino&grupo=${encodeURIComponent(slug)}`);
      return;
    }

    if (profile?.accountRole !== "inquilino") {
      navigate("/profile");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const group = await fetchGroupBySlug(slug);
      if (!group) {
        setError(es.groups.empty);
        return;
      }
      const err = await requestJoinGroup(group.id);
      if (err) setError(err);
      else {
        setJoined(true);
        navigate(`/grupos/${slug}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (error && !preview) {
    return (
      <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <ErrorState message={error} />
        <Link to="/" className="mt-4 inline-flex text-teal-accent hover:underline">
          {es.common.back}
        </Link>
      </main>
    );
  }

  if (!preview) return null;

  const canJoin = preview.status === "forming" && preview.spotsLeft > 0;

  return (
    <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <div className="rounded-xl border border-border-light bg-surface-container-lowest p-8 text-center card-shadow">
        <Icon name="groups" className="mx-auto text-[48px] text-teal-accent" />
        <h1 className="mt-4 text-headline-lg text-deep-navy">{es.groups.inviteTitle}</h1>
        <p className="mt-2 text-body-md text-warm-slate">{es.groups.inviteSubtitle}</p>

        <div className="mt-8 rounded-lg bg-surface-container p-6 text-left">
          <h2 className="text-headline-md text-deep-navy">{preview.name}</h2>
          {preview.city && (
            <p className="mt-1 flex items-center gap-1 text-body-sm text-warm-slate">
              <Icon name="location_on" className="text-[16px]" />
              {preview.city}
            </p>
          )}
          <p className="mt-3 text-body-sm text-warm-slate">
            {preview.confirmedCount}/{preview.targetMembers} {es.groups.members}
            {canJoin && ` · ${preview.spotsLeft} ${es.groups.spotsLeft}`}
          </p>
          <span className="mt-3 inline-block rounded-full bg-surface-container-lowest px-3 py-1 text-label-sm">
            {es.groups.status[preview.status]}
          </span>
        </div>

        {error && <p className="mt-4 text-body-sm text-error">{error}</p>}

        {canJoin ? (
          <button
            type="button"
            disabled={busy || joined}
            onClick={handleJoin}
            className="mt-8 w-full rounded-lg bg-deep-navy py-3 text-label-md text-on-primary disabled:opacity-60"
          >
            {busy
              ? es.common.pleaseWait
              : user
                ? es.groups.inviteJoin
                : es.groups.inviteSignUp}
          </button>
        ) : (
          <p className="mt-8 text-body-sm text-warm-slate">{es.groups.groupFormed}</p>
        )}

        <Link to="/" className="mt-4 inline-block text-label-md text-teal-accent hover:underline">
          {es.common.back}
        </Link>
      </div>
    </main>
  );
}
