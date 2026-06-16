import { useEffect, useState } from "react";
import { fetchMoonScore, type MoonScore, type MoonScoreTier } from "@habitus/core";
import { Icon } from "./Icon";
import { useI18n } from "../lib/I18nContext";

type MoonScoreBadgeProps = {
  profileId: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Sello de Moon Score (reputacion portable del conviviente). Hermano visual del
 * IdentityBadge: mismo patron de pill + icono Phosphor + colores semanticos.
 *
 * Se alimenta solo: dado un profileId, lee el moon_score cacheado en el perfil.
 * Si aun no hay endosos (no "live"), muestra "Construyendo reputacion" en muted.
 * Si la migracion del Moon Score aun no esta aplicada, degrada con elegancia
 * (fetchMoonScore devuelve null -> estado muted).
 */
const tierStyles: Record<MoonScoreTier, string> = {
  excellent: "bg-teal-accent/15 text-teal-accent border-teal-accent/30",
  good: "bg-sky-100 text-sky-800 border-sky-200",
  building: "bg-amber-100 text-amber-800 border-amber-200",
  new: "bg-surface-container text-warm-slate border-border-light",
};

export function MoonScoreBadge({ profileId, size = "md", className = "" }: MoonScoreBadgeProps) {
  const t = useI18n();
  const [data, setData] = useState<MoonScore | null>(null);

  useEffect(() => {
    let active = true;
    fetchMoonScore(profileId)
      .then((ms) => {
        if (active) setData(ms);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profileId]);

  const tier: MoonScoreTier = data?.tier ?? "new";
  const score = data?.score ?? 0;
  const count = data?.endorsements ?? 0;
  const live = data?.live ?? false;

  const tierLabel: Record<MoonScoreTier, string> = {
    excellent: t.profile.moonScore.tierExcellent,
    good: t.profile.moonScore.tierGood,
    building: t.profile.moonScore.tierBuilding,
    new: t.profile.moonScore.tierNew,
  };

  const label = live ? `${score} · ${tierLabel[tier]}` : t.profile.moonScore.building;
  const title = live
    ? `${t.profile.moonScore.title} · ${count} ${t.profile.moonScore.endorsedBy}`
    : t.profile.moonScore.title;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${tierStyles[tier]} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-label-sm"
      } ${className}`}
    >
      <Icon name="star_fill" className={size === "sm" ? "text-[14px]" : "text-[16px]"} />
      {label}
    </span>
  );
}
