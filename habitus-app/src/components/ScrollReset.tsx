import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resetScrollLock } from "../lib/useScrollLock";

/** Restaura scroll al navegar (evita body overflow:hidden huérfano). */
export function ScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    resetScrollLock();
    const scrollRoot = document.querySelector("[data-scroll-root]");
    if (scrollRoot instanceof HTMLElement) {
      scrollRoot.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
