import { Link, useLocation } from "react-router-dom";
import { primaryNavItemsForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

export function BottomNav() {
  const location = useLocation();
  const { profile, user } = useAuth();

  if (!user) return null;

  const items = primaryNavItemsForRole(profile?.accountRole);
  const colCount = Math.min(items.length, 5);

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-border-light bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0px_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-lg md:hidden">
      <div
        className="mx-auto grid h-[4.25rem] max-w-lg items-stretch"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors ${
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
}
