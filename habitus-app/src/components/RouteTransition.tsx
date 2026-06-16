import { Outlet, useLocation } from "react-router-dom";

/**
 * Envía el <Outlet/> de un layout y reproducen una animación de entrada en
 * cada navegación, remontando el subárbol con `key={pathname}`.
 *
 * Animación solo de entrada (no de salida): las salidas no son viables con CSS
 * puro sin framer-motion, y la entrada es lo que aporta la sensación "push"
 * nativa. `prefers-reduced-motion` se respeta globalmente en index.css.
 */
export function RouteTransition() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-route-enter">
      <Outlet />
    </div>
  );
}
