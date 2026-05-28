import { HeroListingCarousel } from "./HeroListingCarousel";
import { HeroReferralHint } from "./HeroReferralHint";
import { HeroSearchForm } from "./HeroSearchForm";
import { useI18n } from "../../lib/I18nContext";
import { getHeroListingSlides } from "./heroListingSlides";

/** Columna derecha del hero: búsqueda (registro) + carrusel público + referencia opcional. */
export function HeroAsidePanel() {
  const t = useI18n();

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
      <HeroSearchForm />
      <HeroListingCarousel slides={getHeroListingSlides(t)} />
      <p className="text-center">
        <HeroReferralHint />
      </p>
    </div>
  );
}
