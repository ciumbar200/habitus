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
        className="mx-auto grid max-w-lg items-stretch"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`, height: NAV_HEIGHT }}
      >
        {items.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 transition-opacity active:opacity-70 ${
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
