import { Link, useLocation } from "react-router-dom";
import { homePathForRole, navItemsForRole, normalizeImageUrl } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { Icon } from "./Icon";
import { UserMenu } from "./UserMenu";

const FALLBACK_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyG1Vj2fNf0xSTn63zYFOCzosjrxS4Cxbm7MCGcUFHRWN25GbwAuKi1Y4SCoqfHdiF7EJGcO2DYT1RSJurWKPTmuR96Rubez-y-Y6vdYNi1L8c9zIh4Ar2Ng2LGa7n0TPqyCyhqdYxDAZwtNB13MJCUja1gTM2aNQ5Wmi65W0VwCrRf903QB46g2WIBd15QXDDTHugUMKwDaVb1vT8P_K1N3UA7GSdne1JL-DfKFMOz9Y-FZpCzh63-lvh0JnjexqpJaAJS4hI6lQ";

type HeaderProps = {
  showBack?: boolean;
};

export function Header({ showBack }: HeaderProps) {
  const location = useLocation();
  const { profile, user } = useAuth();
  const avatar = normalizeImageUrl(profile?.avatarUrl) ?? FALLBACK_AVATAR;
  const navItems = user ? navItemsForRole(profile?.accountRole) : [];
  const onProperty = location.pathname.startsWith("/property/");
  const useBack = showBack || onProperty;

  return (
    <header className="glass-header fixed top-0 z-50 h-16 w-full border-b border-border-light">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-4">
          {useBack ? (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="cursor-pointer text-deep-navy transition-transform active:scale-95"
              aria-label={es.common.back}
            >
              <Icon name="arrow_back" />
            </button>
          ) : (
            <Link to={user ? "/profile" : "/access"}>
              <img
                src={avatar}
                alt={es.nav.myProfile}
                className="h-10 w-10 cursor-pointer rounded-full border border-border-light object-cover transition-transform active:scale-95"
              />
            </Link>
          )}
          <Link
            to={user ? homePathForRole(profile?.accountRole) : "/access"}
            className="text-headline-md tracking-tight text-deep-navy"
          >
            {es.brand}
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-label-md transition-opacity hover:opacity-80 ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "font-bold text-deep-navy"
                    : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <UserMenu />
          ) : (
            <Link
              to="/access"
              className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-white"
            >
              {es.common.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
