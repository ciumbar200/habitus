import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { CompatibilityScore } from "../components/CompatibilityScore";
import { CompatibilityNotice } from "../components/CompatibilityNotice";
import { HostProfileCard } from "../components/HostProfileCard";
import { IdentityBadge } from "../components/IdentityBadge";
import { PropertyVerificationBadge } from "../components/PropertyVerificationBadge";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../hooks/useBookmarks";
import { translateAmenityLabel } from "../lib/amenities";
import { useI18n } from "../lib/I18nContext";
import { saveReturnTo } from "../lib/returnTo";
import { formatAvailableDate, formatMoonLocation, formatPrice } from "@habitus/core";
import {
  fetchCompatQuiz,
  fetchPropertyBySlug,
  fetchPropertyImages,
  getListingUuidBySlug,
  fetchMyFormedGroups,
} from "@habitus/core";
import { createApplication } from "@habitus/core";
import type { Property, LivingGroup } from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function PropertyDetailPage() {
  const t = useI18n();
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isListingSaved, toggleListing } = useBookmarks();
  const [property, setProperty] = useState<Property | null>(null);
  const [gallery, setGallery] = useState<{ url: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [formedGroups, setFormedGroups] = useState<LivingGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const propertyPath = slug ? `/property/${slug}` : null;

  useEffect(() => {
    if (!slug) {
      setError(t.property.notFound);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError(t.discover.configError);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});

    quizPromise
      .then((quiz) =>
        Promise.all([fetchPropertyBySlug(slug, quiz), fetchPropertyImages(slug)]),
      )
      .then(([prop, images]) => {
        if (!prop) {
          setError(t.property.notFound);
          setProperty(null);
          return;
        }
        setProperty(prop);
        setGallery(images);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug, user?.id, t]);

  useEffect(() => {
    if (!user?.id || profile?.accountRole !== "inquilino") {
      setFormedGroups([]);
      return;
    }
    fetchMyFormedGroups(user.id)
      .then(setFormedGroups)
      .catch(() => setFormedGroups([]));
  }, [user?.id, profile?.accountRole]);

  function goToAccess(signup = false) {
    if (!propertyPath) return;
    saveReturnTo(propertyPath);
    navigate("/access", { state: { from: propertyPath, signup } });
  }

  const handleApply = async (groupId?: string | null) => {
    if (!user) {
      goToAccess(true);
      return;
    }
    if (!slug) return;

    setApplying(true);
    setApplyMsg(null);
    const listingId = await getListingUuidBySlug(slug);
    if (!listingId) {
      setApplyMsg(t.property.notFound);
      setApplying(false);
      return;
    }

    const { error: err } = await createApplication(
      user.id,
      listingId,
      groupId ?? (selectedGroupId || null),
    );
    setApplying(false);
    if (err) {
      setApplyMsg(err);
    } else {
      setApplyMsg(t.property.applySuccess);
      if (propertyPath) saveReturnTo(propertyPath);
      navigate("/profile");
    }
  };

  const handleBookmark = async () => {
    if (!user || !slug) {
      goToAccess(false);
      return;
    }
    await toggleListing(slug);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl pb-32 pt-16">
        <LoadingState message={t.common.loading} />
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-16">
        <ErrorState message={error ?? t.property.notFound} />
        <p className="mt-6 text-center">
          <Link to="/descubrir" className="text-teal-accent hover:underline">
            {t.common.exploreSpaces}
          </Link>
        </p>
      </main>
    );
  }

  const secondaryImages = gallery.length > 0 ? gallery : [];
  const saved = slug ? isListingSaved(slug) : false;
  const coverImage =
    property.image ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop";

  return (
    <main className="mx-auto max-w-7xl pb-32 pt-16">
      <section className="mt-stack-lg px-margin-mobile md:px-margin-desktop">
        <div className="grid h-[400px] grid-cols-1 grid-rows-2 gap-4 md:h-[600px] md:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl md:col-span-2 md:row-span-2">
            <img
              src={coverImage}
              alt={property.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {property.visibility === "private" && (
              <span className="absolute top-4 left-4 rounded-full bg-deep-navy/90 px-3 py-1 text-label-sm text-white">
                {t.property.privateBadge}
              </span>
            )}
            <button
              type="button"
              onClick={handleBookmark}
              className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md ${
                saved ? "text-teal-accent" : "text-deep-navy"
              }`}
              aria-label={saved ? t.common.saved : t.common.save}
            >
              <Icon name="bookmark" filled={saved} />
            </button>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-headline-lg md:text-display-lg">{property.name}</h1>
              <p className="text-body-md opacity-90">{formatMoonLocation(property.city, property.location)}</p>
            </div>
          </div>
          {secondaryImages[0] && (
            <div className="hidden overflow-hidden rounded-xl md:col-span-2 md:block">
              <img
                src={secondaryImages[0].url}
                alt={secondaryImages[0].alt}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {secondaryImages[1] && (
            <div className="hidden overflow-hidden rounded-xl md:block">
              <img
                src={secondaryImages[1].url}
                alt={secondaryImages[1].alt}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="mt-stack-lg grid grid-cols-1 gap-stack-lg px-margin-mobile md:px-margin-desktop lg:grid-cols-12">
        <div className="space-y-stack-lg lg:col-span-8">
          {property.host && <HostProfileCard host={property.host} />}

          <CompatibilityNotice mode={property.compatibilityMode} />

          {(property.propertyVerificationStatus !== "none" ||
            property.ownerIdentityStatus === "verified" ||
            property.host?.identityStatus === "verified") && (
            <div className="rounded-xl border border-border-light bg-surface-container-lowest p-5 card-shadow">
              <h2 className="mb-3 text-headline-md text-deep-navy">{t.property.trustTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {property.ownerIdentityStatus === "verified" && (
                  <IdentityBadge status="verified" size="sm" />
                )}
                {property.host?.identityStatus === "verified" && (
                  <IdentityBadge status="verified" size="sm" />
                )}
                <PropertyVerificationBadge status={property.propertyVerificationStatus} size="sm" />
              </div>
              {property.propertyVerificationStatus === "verified" && (
                <p className="mt-3 text-body-sm text-warm-slate">
                  {t.propertyVerification.verifiedHint}
                </p>
              )}
            </div>
          )}

          {property.visibility === "private" && (
            <p className="rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
              {t.property.privateHint}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
            <div className="border-r border-border-light text-center">
              <p className="text-label-sm uppercase tracking-wider text-warm-slate">
                {t.property.startingAt}
              </p>
              <p className="mt-1 text-headline-md text-teal-accent">
                {formatPrice(property.price, property.currency)}
              </p>
            </div>
            <div className="border-r border-border-light text-center">
              <p className="text-label-sm uppercase tracking-wider text-warm-slate">
                {t.property.available}
              </p>
              <p className="mt-1 text-headline-md text-deep-navy">
                {formatAvailableDate(property.availableFrom)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-label-sm uppercase tracking-wider text-warm-slate">
                {property.categorySlug === "piso-grupo"
                  ? t.property.propertyType
                  : t.property.roomType}
              </p>
              <p className="mt-1 text-headline-md text-deep-navy">{property.roomType ?? "—"}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-headline-md text-deep-navy">{t.property.about}</h2>
            <p className="text-body-lg leading-relaxed text-on-surface-variant">
              {property.description ??
                t.property.descriptionFallback
                  .replace("{location}", formatMoonLocation(property.city, property.location))
                  .replace("{name}", property.name)}
            </p>
          </div>

          {property.listingConditions?.trim() && (
            <div className="border-t border-border-light pt-8">
              <h2 className="mb-4 text-headline-md text-deep-navy">{t.property.conditions}</h2>
              <p className="whitespace-pre-wrap text-body-lg leading-relaxed text-on-surface-variant">
                {property.listingConditions}
              </p>
            </div>
          )}

          {property.amenities.length > 0 && (
            <div className="border-t border-border-light pt-8">
              <h2 className="mb-6 text-headline-md text-deep-navy">{t.property.amenities}</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {property.amenities.map((a) => (
                  <div key={a.label} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-teal-accent">
                      <Icon name={a.icon} />
                    </div>
                    <p className="text-label-md text-deep-navy">{translateAmenityLabel(a, t)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
            <p className="mb-2 text-label-sm uppercase tracking-wider text-warm-slate">
              {t.property.membershipApplication}
            </p>
            <p className="mb-6 text-headline-md text-deep-navy">
              {formatPrice(property.price, property.currency)}
              <span className="text-body-md text-warm-slate"> / {t.common.perMonth}</span>
            </p>
            {applyMsg && (
              <p className="mb-3 text-label-sm text-teal-accent">{applyMsg}</p>
            )}
            {user && formedGroups.length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block text-label-sm text-deep-navy">
                  {t.application.selectGroup}
                </label>
                <select
                  className="field-input w-full"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">{t.application.applySolo}</option>
                  {formedGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.memberCount} {t.groups.members.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              disabled={applying}
              onClick={() => handleApply()}
              className="mb-3 w-full rounded-lg bg-deep-navy py-4 text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {applying
                ? t.property.applySending
                : user
                  ? t.property.apply
                  : t.property.signInToApply}
            </button>
            {!user && (
              <p className="mb-3 text-center text-label-sm text-warm-slate">
                {t.access.propertySignupHint}
              </p>
            )}
            <Link
              to="/grupos"
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border-light py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container"
            >
              <Icon name="groups" className="text-[20px]" />
              {t.groups.create}
            </Link>
            <Link
              to="/matches"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-light py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container"
            >
              <Icon name="group" className="text-[20px]" />
              {t.property.viewRoommates}
            </Link>
            {profile && property.compatibilityMode === "host" && property.compatibility != null && (
              <div className="mt-4">
                <CompatibilityScore
                  score={property.compatibility}
                  result={property.compatibilityResult}
                  label={t.property.profileCompatible}
                  defaultOpen={Boolean(property.compatibilityResult?.dimensions.length)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
