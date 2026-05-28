import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LANDING_HERO_IMAGE } from "../../lib/brandAssets";
import { useLanguage } from "../../lib/I18nContext";
import { Logo } from "../Logo";
import { Icon } from "../Icon";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  backTo?: { href: string; label: string };
};

export function AuthShell({ children, title, subtitle, backTo }: AuthShellProps) {
  const { t } = useLanguage();
  const { landing } = t.public;

  const trustPoints = [
    t.access.authTrustCompat,
    t.access.authTrustVerified,
    t.access.authTrustCities,
  ];

  return (
    <div className="auth-page min-h-[100dvh] lg:grid lg:grid-cols-2">
      {/* Panel visual — mitad izquierda a pantalla completa en desktop */}
      <aside className="relative hidden overflow-hidden lg:block lg:min-h-[100dvh]">
        <img
          src={LANDING_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-900/75 to-stone-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/20" />

        <div className="relative z-10 flex min-h-[100dvh] flex-col p-10 lg:p-12">
          <Link to="/" className="inline-flex">
            <Logo variant="dark" height={36} />
          </Link>

          <div className="mt-auto max-w-lg pb-4">
            <p className="hero-badge">{landing.badge}</p>
            <h1 className="hero-display">
              <span className="block">{landing.heroLine1}</span>
              <span className="hero-display-accent block">{landing.heroLine2}</span>
            </h1>
            <p className="hero-subtitle">{landing.heroSubtitle}</p>
            <ul className="mt-8 space-y-3">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-stone-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-accent/20 text-teal-accent">
                    <Icon name="check" className="text-[14px]" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <div className="flex min-h-[100dvh] flex-col justify-center bg-white px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex">
              <Logo variant="light" height={32} />
            </Link>
          </div>

          {backTo && (
            <Link
              to={backTo.href}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              {backTo.label}
            </Link>
          )}

          <header className="mb-8">
            <h2 className="section-title text-[1.75rem] sm:text-[2rem]">{title}</h2>
            <p className="mt-2 text-base leading-relaxed text-stone-500">{subtitle}</p>
          </header>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
