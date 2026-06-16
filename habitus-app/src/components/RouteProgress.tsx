import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Barra de progreso superior (estilo NProgress) sin dependencias. Se activa en
 * cada cambio de `pathname` y avanza con una heurística temporal que cubre la
 * carga del chunk de la ruta (Suspense). Para navegaciones con chunks ya en
 * caché, la barra aparece y desaparece brevemente — la sensación nativa que
 * buscamos. `prefers-reduced-motion` la deja instantánea vía index.css.
 */
export function RouteProgress() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setVisible(true);
    setWidth(8);
    timers.current.push(window.setTimeout(() => setWidth(60), 80));
    timers.current.push(window.setTimeout(() => setWidth(85), 240));
    timers.current.push(
      window.setTimeout(() => {
        setWidth(100);
        timers.current.push(window.setTimeout(() => setVisible(false), 200));
      }, 320),
    );

    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-0.5">
      <div
        className="h-full bg-teal-accent shadow-[0_0_8px_rgba(20,184,166,0.6)]"
        style={{
          width: `${width}%`,
          transition: "width 250ms ease-out, opacity 200ms ease-out",
          opacity: width === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
