import { useEffect, useState } from "react";
import {
  completePropertyVerificationDemo,
  createListing,
  deleteListing,
  DEFAULT_FLOOR_PROPERTY_TYPE,
  es,
  FLOOR_PROPERTY_TYPES,
  fetchCategories,
  fetchListingAmenitiesForEdit,
  fetchListingForEdit,
  fetchListingGalleryUrls,
  LISTING_AMENITY_PRESETS,
  listingCopyForRole,
  replaceListingAmenities,
  replaceListingGallery,
  requestPropertyVerification,
  slugify,
  updateListing,
  type Category,
  type ListingFormInput,
  type ListingStatus,
  type PropertyVerificationStatus,
} from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";
import { useAuth } from "../../context/AuthContext";
import { CoverImageUpload } from "../CoverImageUpload";
import { ListingGalleryUpload } from "../ListingGalleryUpload";
import { PropertyVerificationBadge } from "../PropertyVerificationBadge";
import { Icon } from "../Icon";
import { LoadingState } from "../PageState";

const emptyForm = (): ListingFormInput => ({
  name: "",
  slug: "",
  location: "",
  city: "Barcelona",
  priceMonthly: 850,
  currency: "EUR",
  roomType: "Habitación doble",
  description: "",
  coverImageUrl: "",
  categoryId: null,
  availableFrom: null,
  status: "draft",
  visibility: "public",
  hostProfileId: null,
  agencyClientName: null,
  listingConditions: "",
});

type ListingEditorFormProps = {
  listingId?: string;
  onSuccess: (result: ListingSaveResult) => void;
  onCancel: () => void;
  onDeleted?: () => void;
};

export type ListingSaveResult = {
  id: string;
  visibility: "public" | "private";
  status: ListingStatus;
};

export function ListingEditorForm({ listingId, onSuccess, onCancel, onDeleted }: ListingEditorFormProps) {
  const isEdit = Boolean(listingId);
  const { user, profile } = useAuth();
  const role = profile?.accountRole as AccountRoleSlug | undefined;

  const [form, setForm] = useState<ListingFormInput>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<{ icon: string; label: string }[]>([]);
  const [propertyVerificationStatus, setPropertyVerificationStatus] =
    useState<PropertyVerificationStatus>("none");
  const [verificationBusy, setVerificationBusy] = useState(false);

  const isHostPublisher = role === "anfitrion";
  const isFloorPublisher = role === "propietario" || role === "agencia";
  const copy = listingCopyForRole(role);

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats);
      if (!isEdit && isHostPublisher) {
        const habitacion = cats.find((c) => c.slug === "habitacion");
        if (habitacion) {
          setForm((f) => (f.categoryId ? f : { ...f, categoryId: habitacion.id, visibility: "public" }));
        }
      }
      if (!isEdit && isFloorPublisher) {
        const pisoGrupo = cats.find((c) => c.slug === "piso-grupo");
        if (pisoGrupo) {
          setForm((f) =>
            f.categoryId
              ? f
              : {
                  ...f,
                  categoryId: pisoGrupo.id,
                  roomType: f.roomType || DEFAULT_FLOOR_PROPERTY_TYPE,
                },
          );
        }
      }
    }).catch(() => {});
  }, [isEdit, isHostPublisher, isFloorPublisher]);

  useEffect(() => {
    if (!isEdit || !user?.id || !listingId) return;
    fetchListingForEdit(user.id, listingId)
      .then((l) => {
        if (!l) {
          setError(es.property.notFound);
          return;
        }
        setForm({
          name: l.name,
          slug: l.slug,
          location: l.location,
          city: l.city,
          priceMonthly: l.priceMonthly,
          currency: l.currency,
          roomType: l.roomType ?? "",
          description: l.description ?? "",
          coverImageUrl: l.coverImageUrl ?? "",
          categoryId: l.categoryId,
          availableFrom: l.availableFrom,
          status: l.status,
          visibility: l.visibility ?? "public",
          hostProfileId: l.hostProfileId,
          agencyClientName: l.agencyClientName,
          listingConditions: l.listingConditions ?? "",
        });
        setPropertyVerificationStatus(l.propertyVerificationStatus ?? "none");
        setSlugManual(true);
        void fetchListingGalleryUrls(listingId)
          .then(setGalleryUrls)
          .catch(() => setGalleryUrls([]));
        void fetchListingAmenitiesForEdit(listingId)
          .then(setAmenities)
          .catch(() => setAmenities([]));
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [isEdit, user?.id, listingId]);

  const set = <K extends keyof ListingFormInput>(key: K, value: ListingFormInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !slugManual) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const save = async (status: ListingStatus) => {
    if (!user?.id || !role) return;

    const name = form.name.trim();
    let slug = form.slug.trim();
    if (!name) {
      setError(copy.nameSlugRequired);
      return;
    }
    if (!slug) {
      slug = slugify(name);
    }
    if (status === "published") {
      if (!slug) {
        setError(copy.nameSlugRequired);
        return;
      }
      if (!form.location.trim() || !form.city.trim()) {
        setError("Indica la dirección y la ciudad antes de publicar.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    const coverUrl = form.coverImageUrl || galleryUrls[0] || "";
    let payload = { ...form, name, slug, coverImageUrl: coverUrl, status };

    if (isHostPublisher) {
      const habitacion = categories.find((c) => c.slug === "habitacion");
      payload = {
        ...payload,
        categoryId: habitacion?.id ?? payload.categoryId,
        visibility: "public",
        hostProfileId: null,
      };
    }

    if (isFloorPublisher) {
      const pisoGrupo = categories.find((c) => c.slug === "piso-grupo");
      payload = {
        ...payload,
        categoryId: pisoGrupo?.id ?? payload.categoryId,
        hostProfileId: null,
        roomType: payload.roomType || DEFAULT_FLOOR_PROPERTY_TYPE,
      };
    }

    let savedId = listingId;

    if (isEdit && listingId) {
      const { error: err } = await updateListing(user.id, listingId, payload, role);
      if (err) {
        setSaving(false);
        setError(err);
        return;
      }
    } else {
      const { id: newId, error: err } = await createListing(user.id, payload, role);
      if (err || !newId) {
        setSaving(false);
        setError(err ?? es.common.errorLoad);
        return;
      }
      savedId = newId;
    }

    try {
      await replaceListingGallery(savedId!, galleryUrls);
      await replaceListingAmenities(savedId!, amenities);
    } catch (e) {
      setSaving(false);
      const msg =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : es.common.errorLoad;
      setError(msg);
      return;
    }

    setSaving(false);
    onSuccess({ id: savedId!, visibility: payload.visibility, status });
  };

  async function handleDelete() {
    if (!user?.id || !listingId || !window.confirm(es.panel.deleteListingConfirm)) return;
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteListing(user.id, listingId);
    setDeleting(false);
    if (err) {
      setError(err);
      return;
    }
    onDeleted?.();
  }

  if (loading) {
    return <LoadingState />;
  }

  const f = es.panel.form;

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
          {error}
        </p>
      )}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save("published");
        }}
      >
        <Field label={copy.formName}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label={f.slug}>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              set("slug", e.target.value);
            }}
            placeholder={slugify(form.name) || "mi-piso-eixample"}
            className="field-input"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={f.location}>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="field-input"
            />
          </Field>
          <Field label={f.city}>
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="field-input"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={f.price}>
            <input
              type="number"
              min={0}
              value={form.priceMonthly}
              onChange={(e) => set("priceMonthly", Number(e.target.value))}
              className="field-input"
            />
          </Field>
          <Field label={f.currency}>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="field-input"
            >
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
            </select>
          </Field>
        </div>
        {isHostPublisher && (
          <Field label={f.roomType}>
            <input
              value={form.roomType}
              onChange={(e) => set("roomType", e.target.value)}
              placeholder="Ej. individual, doble, con baño…"
              className="field-input"
            />
          </Field>
        )}
        {isFloorPublisher && (
          <Field label={f.propertyType}>
            <select
              value={form.roomType || DEFAULT_FLOOR_PROPERTY_TYPE}
              onChange={(e) => set("roomType", e.target.value)}
              className="field-input"
            >
              {FLOOR_PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={f.availableFrom}>
          <input
            type="date"
            value={form.availableFrom ?? ""}
            onChange={(e) => set("availableFrom", e.target.value || null)}
            className="field-input"
          />
        </Field>
        <Field label={f.coverUrl}>
          {user?.id ? (
            <CoverImageUpload
              userId={user.id}
              value={form.coverImageUrl || galleryUrls[0] || null}
              onChange={(url) => set("coverImageUrl", url ?? "")}
            />
          ) : (
            <input
              value={form.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              placeholder="https://…"
              className="field-input"
            />
          )}
        </Field>
        {user?.id && (
          <Field label={f.gallery}>
            <ListingGalleryUpload
              userId={user.id}
              urls={galleryUrls}
              onChange={setGalleryUrls}
            />
          </Field>
        )}
        <Field label={f.amenities}>
          <div className="flex flex-wrap gap-2">
            {LISTING_AMENITY_PRESETS.map((preset) => {
              const selected = amenities.some((a) => a.label === preset.label);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setAmenities((prev) =>
                      selected
                        ? prev.filter((a) => a.label !== preset.label)
                        : [...prev, preset],
                    );
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-label-sm transition-colors ${
                    selected
                      ? "border-teal-accent bg-teal-accent/10 text-deep-navy"
                      : "border-border-light text-warm-slate hover:border-teal-accent/40"
                  }`}
                >
                  <Icon name={preset.icon} className="text-[14px]" />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label={f.description}>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label={f.conditions} hint={f.conditionsHint}>
          <textarea
            rows={5}
            value={form.listingConditions}
            onChange={(e) => set("listingConditions", e.target.value)}
            placeholder={f.conditionsPlaceholder}
            className="field-input"
          />
        </Field>
        {isEdit && listingId && (
          <details className="rounded-xl border border-border-light bg-surface-container-lowest p-5">
            <summary className="cursor-pointer list-none text-label-md font-semibold text-deep-navy [&::-webkit-details-marker]:hidden">
              <span className="inline-flex flex-wrap items-center gap-2">
                {f.propertyVerification}
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm font-normal text-warm-slate">
                  {es.common.optional}
                </span>
              </span>
              <p className="mt-1 text-body-sm font-normal text-warm-slate">{f.propertyVerificationHint}</p>
            </summary>
            <div className="mt-4 border-t border-border-light pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <PropertyVerificationBadge status={propertyVerificationStatus} />
              </div>
              <p className="mt-3 text-body-sm text-warm-slate">{es.propertyVerification.skipHint}</p>
              {propertyVerificationStatus === "none" && user?.id && (
                <button
                  type="button"
                  disabled={verificationBusy}
                  onClick={async () => {
                    if (!user?.id || !listingId) return;
                    setVerificationBusy(true);
                    const { error: err } = await requestPropertyVerification(user.id, listingId);
                    if (!err) setPropertyVerificationStatus("pending");
                    else setError(err);
                    setVerificationBusy(false);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-accent px-5 py-3 text-label-md text-teal-accent transition-colors hover:bg-teal-accent/5 disabled:opacity-60"
                >
                  <Icon name="home_work" />
                  {verificationBusy ? es.common.pleaseWait : es.propertyVerification.startDemo}
                </button>
              )}
              {propertyVerificationStatus === "pending" && user?.id && (
                <>
                  <p className="mt-3 text-body-sm text-warm-slate">{es.propertyVerification.pendingHint}</p>
                  <button
                    type="button"
                    disabled={verificationBusy}
                    onClick={async () => {
                      if (!user?.id || !listingId) return;
                      setVerificationBusy(true);
                      const { error: err } = await completePropertyVerificationDemo(user.id, listingId);
                      if (!err) setPropertyVerificationStatus("verified");
                      else setError(err);
                      setVerificationBusy(false);
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-deep-navy px-5 py-3 text-label-md text-deep-navy transition-colors hover:bg-surface-container disabled:opacity-60"
                  >
                    <Icon name="verified_user" />
                    {verificationBusy ? es.common.pleaseWait : es.propertyVerification.completeDemo}
                  </button>
                </>
              )}
              {propertyVerificationStatus === "verified" && (
                <p className="mt-3 text-body-sm text-warm-slate">{es.propertyVerification.verifiedHint}</p>
              )}
            </div>
          </details>
        )}
        {!isEdit && (
          <p className="rounded-lg bg-surface-container px-4 py-3 text-body-sm text-warm-slate">
            {f.propertyVerificationSaveFirst}
          </p>
        )}
        {!isHostPublisher && (
          <Field label={f.visibility}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  form.visibility === "public"
                    ? "border-teal-accent bg-teal-accent/5"
                    : "border-border-light"
                }`}
                onClick={() => set("visibility", "public")}
                onKeyDown={(e) => e.key === "Enter" && set("visibility", "public")}
                role="button"
                tabIndex={0}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="sr-only"
                  checked={form.visibility === "public"}
                  onChange={() => set("visibility", "public")}
                  tabIndex={-1}
                />
                <p className="text-label-md font-medium text-deep-navy">{f.visibilityPublic}</p>
              </div>
              <div
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  form.visibility === "private"
                    ? "border-teal-accent bg-teal-accent/5"
                    : "border-border-light"
                }`}
                onClick={() => set("visibility", "private")}
                onKeyDown={(e) => e.key === "Enter" && set("visibility", "private")}
                role="button"
                tabIndex={0}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="sr-only"
                  checked={form.visibility === "private"}
                  onChange={() => set("visibility", "private")}
                  tabIndex={-1}
                />
                <p className="text-label-md font-medium text-deep-navy">{f.visibilityPrivate}</p>
                <p className="mt-1 text-body-sm text-warm-slate">{f.visibilityPrivateHint}</p>
              </div>
            </div>
          </Field>
        )}
        {role === "agencia" && (
          <Field label={f.clientName}>
            <input
              value={form.agencyClientName ?? ""}
              onChange={(e) => set("agencyClientName", e.target.value || null)}
              className="field-input"
            />
          </Field>
        )}

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy disabled:opacity-60"
          >
            {es.common.cancel}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("draft")}
            className="rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy disabled:opacity-60"
          >
            {f.saveDraft}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white disabled:opacity-60"
          >
            {saving ? es.common.pleaseWait : copy.formPublish}
          </button>
        </div>
      </form>

      {isEdit && listingId && (
        <section className="mt-8 rounded-xl border border-error/30 bg-error-container/10 p-6">
          <h2 className="text-label-md font-semibold text-error">{es.account.dangerZone}</h2>
          <p className="mt-2 text-body-sm text-warm-slate">{es.panel.deleteListingConfirm}</p>
          <button
            type="button"
            disabled={saving || deleting}
            onClick={handleDelete}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-error px-5 py-3 text-label-md text-error transition-colors hover:bg-error-container/30 disabled:opacity-60"
          >
            <Icon name="delete" className="text-[20px]" />
            {deleting ? es.common.pleaseWait : es.panel.deleteListing}
          </button>
        </section>
      )}
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-label-md text-deep-navy">{label}</label>
      {hint && <p className="mb-2 text-body-sm text-warm-slate">{hint}</p>}
      {children}
    </div>
  );
}
