import { Link, useNavigate } from "react-router-dom";
import { es } from "@habitus/core";
import type { Property } from "@habitus/core";
import { Icon } from "./Icon";
import { CompatibilityScore } from "./CompatibilityScore";
import { HostProfileCard } from "./HostProfileCard";
import { PropertyVerificationBadge } from "./PropertyVerificationBadge";

type PropertyCardProps = {
  property: Property;
  isSaved?: boolean;
  onToggleBookmark?: (slug: string) => void;
};

export function PropertyCard({ property, isSaved, onToggleBookmark }: PropertyCardProps) {
  const navigate = useNavigate();

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(property.slug);
    } else {
      navigate("/access");
    }
  };

  const compatLabel =
    property.compatibilityMode === "owner_only"
      ? es.property.compatOwnerOnly.slice(0, 28) + "…"
      : es.common.compatible;

  return (
    <article className="group overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest card-shadow transition-all duration-300 hover:-translate-y-1">
      <Link to={`/property/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.image}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 max-w-[calc(100%-5rem)]">
            {property.compatibilityMode === "host" ? (
              <CompatibilityScore
                score={property.compatibility}
                result={property.compatibilityResult}
                label={es.common.compatible}
                stopPropagation
              />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-label-sm font-bold text-deep-navy backdrop-blur-md">
                <Icon name="groups" className="text-[14px] text-teal-accent" />
                {property.categoryLabel ?? es.groups.title.split(" ")[0]}
              </span>
            )}
          </div>
          {property.visibility === "private" && (
            <span className="absolute bottom-4 left-4 rounded-full bg-deep-navy/90 px-2 py-0.5 text-label-sm text-white backdrop-blur-md">
              {es.property.privateBadge}
            </span>
          )}
          {property.propertyVerificationStatus === "verified" && (
            <span className="absolute bottom-4 right-4">
              <PropertyVerificationBadge status="verified" size="sm" />
            </span>
          )}
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={isSaved ? es.common.saved : es.common.save}
            className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md transition-colors ${
              isSaved ? "text-teal-accent" : "text-deep-navy hover:text-teal-accent"
            }`}
          >
            <Icon name="bookmark" filled={isSaved} />
          </button>
        </div>

        <div className="p-stack-md">
          <div className="mb-2 flex items-start justify-between">
            <div>
              {property.categoryLabel && property.compatibilityMode === "host" && (
                <span className="mb-1 inline-block rounded-full bg-teal-accent/15 px-2 py-0.5 text-label-sm font-medium text-teal-accent">
                  {property.categoryLabel}
                </span>
              )}
              <h3 className="text-headline-md text-deep-navy">{property.name}</h3>
              <p className="flex items-center gap-1 text-body-md text-warm-slate">
                <Icon name="location_on" className="text-[16px]" />
                {property.location}
              </p>
            </div>
            <div className="text-right">
              <p className="text-headline-md text-teal-accent">
                {property.currencySymbol}
                {property.price.toLocaleString("es-ES")}
              </p>
              <p className="text-label-sm text-warm-slate">{es.common.perMonth}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border-light pt-4">
            {property.amenities.slice(0, 3).map((a) => (
              <span
                key={a.label}
                className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1 text-label-sm text-deep-navy"
              >
                <Icon name={a.icon} className="text-[14px]" />
                {a.label}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {property.host && (
        <div className="border-t border-border-light px-stack-md pb-stack-md">
          <HostProfileCard host={property.host} compact />
        </div>
      )}

      {property.compatibilityMode === "owner_only" && (
        <p className="px-stack-md pb-stack-md text-[11px] leading-snug text-warm-slate">{compatLabel}</p>
      )}
    </article>
  );
}
