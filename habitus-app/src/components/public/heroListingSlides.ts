import type { I18n } from "@habitus/core";

export type HeroListingSlide = {
  url: string;
  alt: string;
  title: string;
  location: string;
  affinity: string;
  href: string;
  tags: readonly { label: string; value: string }[];
};

const HERO_LISTING_MEDIA = [
  {
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
    affinity: "94%",
    href: "/alojamientos?ciudad=barcelona&zona=gracia",
  },
  {
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    affinity: "91%",
    href: "/alojamientos?ciudad=madrid",
  },
  {
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    affinity: "89%",
    href: "/alojamientos?ciudad=barcelona&zona=poblenou",
  },
];

export function getHeroListingSlides(t: I18n): HeroListingSlide[] {
  return HERO_LISTING_MEDIA.map((item, index) => ({
    ...item,
    ...t.public.heroListingCarousel.slides[index],
  }));
}
