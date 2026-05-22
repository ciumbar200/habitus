import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { homePathForRole, normalizeImageUrl, primaryNavItemsForRole } from "@habitus/core";
import { es } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

const FALLBACK_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyG1Vj2fNf0xSTn63zYFOCzosjrxS4Cxbm7MCGcUFHRWN25GbwAuKi1Y4SCoqfHdiF7EJGcO2DYT1RSJurWKPTmuR96Rubez-y-Y6vdYNi1L8c9zIh4Ar2Ng2LGa7n0TPqyCyhqdYxDAZwtNB13MJCUja1gTM2aNQ5Wmi65W0VwCrRf903QB46g2WIBd15QXDDTHugUMKwDaVb1vT8P_K1N3UA7GSdne1JL-DfKFMOz9Y-FZpCzh63-lvh0JnjexqpJaAJS4hI6lQ";

export function UserMenu() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const avatar = normalizeImageUrl(profile?.avatarUrl) ?? FALLBACK_AVATAR;
  const home = homePathForRole(profile?.accountRole);
  const navItems = primaryNavItemsForRole(profile?.accountRole);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border-light bg-white py-1 pr-3 pl-1 transition-colors hover:bg-surface-container-low"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={es.nav.openMenu}
      >
        <img
          src={avatar}
          alt=""
          className="h-9 w-9 rounded-full object-cover"
        />
        <Icon name={open ? "expand_less" : "expand_more"} className="text-[20px] text-deep-navy" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border-light bg-surface-container-lowest py-2 shadow-lg"
        >
          <div className="border-b border-border-light px-4 py-3">
            <p className="truncate text-label-md font-semibold text-deep-navy">
              {profile?.displayName ?? es.profile.memberFallback}
            </p>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="text-label-sm text-teal-accent hover:underline"
            >
              {es.nav.myProfile}
            </Link>
          </div>

          <div className="py-1 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low"
              >
                <Icon name={item.icon} className="text-[18px] text-teal-accent" />
                {item.label}
              </Link>
            ))}
          </div>

          {profile?.isAdmin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low"
            >
              <Icon name="admin_panel_settings" className="text-[18px] text-teal-accent" />
              {es.admin.nav.short}
            </Link>
          )}

          <Link
            to={home}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-label-md text-deep-navy hover:bg-surface-container-low"
          >
            <Icon name="home" className="text-[18px] text-teal-accent" />
            {es.nav.home}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-label-md text-error hover:bg-error-container/30"
          >
            <Icon name="logout" className="text-[18px]" />
            {es.common.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
