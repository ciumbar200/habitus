import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

/** Bloquea scroll del documento (menús móviles, modales). Ref-count para overlays anidados. */
export function setScrollLock(locked: boolean): void {
  if (locked) {
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return;
  }

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow || "";
    previousOverflow = "";
  }
}

/** Fuerza desbloqueo (p. ej. al cambiar de ruta). */
export function resetScrollLock(): void {
  lockCount = 0;
  previousOverflow = "";
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.documentElement.style.overflow = "";
}

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    setScrollLock(true);
    return () => setScrollLock(false);
  }, [active]);
}
