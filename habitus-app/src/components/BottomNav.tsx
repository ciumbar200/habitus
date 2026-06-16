import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { primaryNavItemsForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

const NAV_HEIGHT = "4.25rem";

export function bottomNavClearance(): string {
  return `calc(${NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`;
}

export function BottomNav() {
  const location = useLocation();
  const { profile, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user || !mounted) return null;

  const items = primaryNavItemsForRole(profile?.accountRole);
  const colCount = Math.min(items.length, 5);

  const activeIndex = items.findIndex(
    (item) =>
      location.pathname === item.path ||
      (item.path !== "/" && location.pathname.startsWith(item.path)),
  );
  const colWidthPct = 100 / colCount;

  const nav = (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-border-light bg-surface/98 shadow-[0px_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-lg md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: "none",
      }}
    >
      <div
        className="relative mx-auto grid max-w-lg items-stretch"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`, height: NAV_HEIGHT }}
      >
        {/* Indicador deslizante de pestaña activa (highlight detrás del icono) */}
        {activeIndex >= 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-2 flex items-center justify-center"
            style={{
              left: 0,
              width: `${colWidthPct}%`,
              transform: `translateX(${activeIndex * 100}%)`,
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span className="h-9 w-12 rounded-full bg-teal-accent/15" />
          </div>
        )}

        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative z-[1] flex flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors active:opacity-70 ${
                active ? "text-teal-accent" : "text-warm-slate"
              }`}
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span
                className={`max-w-full truncate text-center text-[10px] leading-tight ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
