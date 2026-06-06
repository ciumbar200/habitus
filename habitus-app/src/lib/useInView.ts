import { useEffect, useRef, useState } from "react";

type Options = {
  /** Fracción visible para disparar (0-1). */
  threshold?: number;
  /** Margen del root (ej. "0px 0px -10% 0px" para disparar un poco antes). */
  rootMargin?: string;
  /** Si true, deja de observar tras la primera aparición. */
  once?: boolean;
};

/**
 * Observa un elemento y devuelve si está (o estuvo) en el viewport.
 * Respeta prefers-reduced-motion: si el usuario lo pide, marca visible al instante.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
