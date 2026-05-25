import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import { LANDING_HERO_IMAGE } from "../../lib/brandAssets";
import { Logo } from "../Logo";
import { Icon } from "../Icon";

const TRUST_POINTS = [
  "Compatibilidad real antes de mudarte",
  "Perfiles verificados y grupos formados",
  "Empezamos por Barcelona · Madrid, Valencia, Sevilla y Granada",
] as const;

type AuthShellProps = {
  children: ReactNode;
  /** Título principal del formulario (serif) */
  title: string;
  subtitle: string;
  backTo?: { href: string; label: string };
};

export function AuthShell({ children, title, subtitle, backTo }: AuthShellProps) {
  return (
    <div className="auth-page min-h-[100dvh] bg-stone-100">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1200px] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Panel visual */}
        <aside className="relative hidden overflow-hidden md:flex md:flex-col md:justify-between">
          <img
            src={LANDING_HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-900/75 to-stone-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/20" />

          <div className="relative z-10 p-10 lg:p-12">
            <Link to="/" className="inline-flex">
              <Logo variant="dark" height={36} />
            </Link>
          </div>

          <div className="relative z-10 p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              : moon shared living
            </p>
            <h1 className="mt-4 max-w-md font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-white lg:text-[2.75rem]">
              {es.access.tagline}
            </h1>
            <ul className="mt-8 space-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-stone-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-accent/20 text-teal-accent">
                    <Icon name="check" className="text-[14px]" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Formulario */}
        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 md:hidden">
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
              <h2 className="font-serif text-[2rem] leading-[1.1] tracking-[-0.02em] text-stone-900 sm:text-[2.25rem]">
                {title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-stone-500">{subtitle}</p>
            </header>

            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
