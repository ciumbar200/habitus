import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { House } from "@phosphor-icons/react";
import { useI18n } from "../../lib/I18nContext";
import type { HeroListingSlide } from "./heroListingSlides";

type HeroListingCarouselProps = {
  slides: HeroListingSlide[];
};

/** Carrusel compacto bajo el formulario: prueba social y acceso a listados públicos. */
export function HeroListingCarousel({ slides }: HeroListingCarouselProps) {
  const t = useI18n();
  const copy = t.public.heroListingCarousel;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[currentIndex] ?? slides[0];

  return (
    <div className="overflow-hidden rounded-2xl bg-white/95 shadow-xl shadow-stone-950/25 ring-1 ring-white/30 sm:rounded-3xl">
      <Link to={slide.href} className="group block">
        <div className="relative aspect-[16/10] sm:aspect-[16/9]">
          {slides.map((item, i) => (
            <img
              key={item.url}
              src={item.url}
              alt={item.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/15 to-transparent" />

          <div className="absolute right-3 top-3 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={copy.viewProperty.replace("{number}", String(i + 1))}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 text-white sm:p-4">
            <div className="mb-2 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <House size={18} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight sm:text-base">{slide.title}</p>
                <p className="text-xs text-white/80">
                  {slide.location} · {slide.affinity} {copy.affinity}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {slide.tags.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] backdrop-blur-sm sm:text-xs"
                >
                  <span className="text-white/70">{item.label}: </span>
                  <span className="font-medium">{item.value}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-medium text-white/90 underline-offset-2 group-hover:underline sm:text-xs">
              {copy.similar}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
