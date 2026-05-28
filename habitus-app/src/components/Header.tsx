import { Link, useLocation } from "react-router-dom";
import { homePathForRole, navItemsForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../lib/I18nContext";
import { Icon } from "./Icon";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";

type HeaderProps = {
  showBack?: boolean;
};

export function Header({ showBack }: HeaderProps) {
  const location = useLocation();
  const { profile, user } = useAuth();
  const t = useI18n();
  const navItems = user ? navItemsForRole(profile?.accountRole) : [];
  const onProperty = location.pathname.startsWith("/property/");
  const useBack = showBack || onProperty;

  return (
    <header className="glass-header fixed top-0 z-50 w-full border-b border-border-light pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-margin-mobile md:px-margin-desktop">
        <div className="flex min-w-0 items-center gap-3">
          {useBack ? (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:opacity-70"
              aria-label={t.common.back}
            >
              <Icon name="arrow_back" />
            </button>
          ) : null}
          <Link
            to={user ? homePathForRole(profile?.accountRole) : "/"}
            className="inline-flex shrink-0 items-center"
          >
            <Logo variant="dark" height={24} />
          </Link>
        </div>

        {/* Desktop: navegación principal */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-label-md font-medium transition-all hover:opacity-80 ${
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path))
                  ? "text-white"
                  : "text-stone-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop: cuenta */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu variant="dark" />
            </>
          ) : (
            <Link
              to="/access"
              className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-white transition-opacity active:opacity-80"
            >
              {t.common.signIn}
            </Link>
          )}
        </div>

        {/* Móvil: campana + menú de perfil (sin hamburguesa duplicada) */}
        <div className="flex items-center gap-2 md:hidden">
          {!user ? (
            <Link
              to="/access"
              className="rounded-lg bg-deep-navy px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity active:opacity-80"
            >
              <span className="sm:hidden">{t.common.signInShort}</span>
              <span className="hidden sm:inline">{t.common.signIn}</span>
            </Link>
          ) : (
            <>
              <NotificationBell />
              <UserMenu variant="dark" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
