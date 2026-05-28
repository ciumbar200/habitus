import type { ComponentType } from "react";
import type { AccountRoleSlug, I18n } from "@habitus/core";
import {
  Briefcase,
  Buildings,
  ChartLineUp,
  ChatCircle,
  CheckCircle,
  Funnel,
  House,
  MagnifyingGlass,
  Shield,
  User,
  UserCircle,
  Users,
} from "@phosphor-icons/react";

type StepIcon = ComponentType<{ size?: number; weight?: "fill" | "bold" | "thin"; className?: string }>;

export type HowItWorksStep = {
  num: string;
  title: string;
  desc: string;
  icon: StepIcon;
};

export type HowItWorksRoleConfig = {
  slug: AccountRoleSlug;
  label: string;
  labelPlural: string;
  headline: string;
  intro: string;
  accent: string;
  accentMuted: string;
  accentRing: string;
  accentBg: string;
  ctaLabel: string;
  landingPath: string;
  steps: HowItWorksStep[];
  extras?: { title: string; items: string[] };
};

type PublicRoleSlug = Exclude<AccountRoleSlug, "embajador">;

// Icon mapping for each role step
const ROLE_ICONS: Record<PublicRoleSlug, StepIcon[]> = {
  inquilino: [User, Users, MagnifyingGlass, ChatCircle, CheckCircle],
  anfitrion: [UserCircle, CheckCircle, House, Funnel, Users],
  propietario: [Shield, Buildings, UserCircle, Users, ChartLineUp],
  agencia: [Briefcase, Buildings, UserCircle, Funnel, ChartLineUp],
};

// Visual configuration (non-translatable)
const ROLE_VISUAL_CONFIG: Record<PublicRoleSlug, {
  accent: string;
  accentMuted: string;
  accentRing: string;
  accentBg: string;
  landingPath: string;
}> = {
  inquilino: {
    accent: "text-terracotta",
    accentMuted: "text-terracotta/80",
    accentRing: "ring-terracotta/30",
    accentBg: "bg-terracotta/10",
    landingPath: "/",
  },
  anfitrion: {
    accent: "text-emerald-700",
    accentMuted: "text-emerald-600",
    accentRing: "ring-emerald-500/30",
    accentBg: "bg-emerald-100",
    landingPath: "/anfitriones",
  },
  propietario: {
    accent: "text-amber-800",
    accentMuted: "text-amber-700",
    accentRing: "ring-amber-500/30",
    accentBg: "bg-amber-100",
    landingPath: "/propietarios",
  },
  agencia: {
    accent: "text-stone-800",
    accentMuted: "text-stone-600",
    accentRing: "ring-stone-400/40",
    accentBg: "bg-stone-200",
    landingPath: "/operadores",
  },
};

/**
 * Get role configurations from translations
 * Call this with useI18n() to get localized content
 */
export function getHowItWorksRoles(t: I18n): HowItWorksRoleConfig[] {
  const hw = t.public.howItWorksPage;
  const roles: PublicRoleSlug[] = ["inquilino", "anfitrion", "propietario", "agencia"];

  return roles.map((slug) => {
    const roleData = hw[slug];
    const visual = ROLE_VISUAL_CONFIG[slug];
    const icons = ROLE_ICONS[slug];

    // Map translation keys to step numbers
    const steps: HowItWorksStep[] = [
      { num: "01", title: roleData.step1Title, desc: roleData.step1Text, icon: icons[0] },
      { num: "02", title: roleData.step2Title, desc: roleData.step2Text, icon: icons[1] },
      { num: "03", title: roleData.step3Title, desc: roleData.step3Text, icon: icons[2] },
      { num: "04", title: roleData.step4Title, desc: roleData.step4Text, icon: icons[3] },
      { num: "05", title: roleData.step5Title, desc: roleData.step5Text, icon: icons[4] },
    ];

    // Build extras - only inquilino has all 3 extras, propietario has 2
    let extras: { title: string; items: string[] } | undefined;
    if ("extrasTitle" in roleData && "extra1" in roleData) {
      if (slug === "inquilino" && "extra3" in roleData) {
        extras = { title: roleData.extrasTitle, items: [roleData.extra1, roleData.extra2, roleData.extra3] };
      } else if (slug === "propietario" && "extra2" in roleData) {
        extras = { title: roleData.extrasTitle, items: [roleData.extra1, roleData.extra2] };
      }
    }

    return {
      ...visual,
      slug,
      label: hw.roles[slug],
      labelPlural: hw.roles[slug + "s" as keyof typeof hw.roles],
      headline: roleData.headline,
      intro: roleData.intro,
      ctaLabel: hw.ctaLabels[slug],
      steps,
      extras,
    };
  });
}

export function howItWorksRoleConfig(slug: AccountRoleSlug, t: I18n): HowItWorksRoleConfig {
  return getHowItWorksRoles(t).find((r) => r.slug === slug) ?? getHowItWorksRoles(t)[0];
}
