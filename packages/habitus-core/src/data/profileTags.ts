/** Etiquetas de estilo de vida para perfil y matching. */
export const PROFILE_LIFESTYLE_TAGS = [
  "Teletrabajo",
  "Vegetariano/a",
  "Sin fumar",
  "Deportista",
  "Mascotas OK",
  "Tranquilo/a",
  "Social",
  "Estudiante",
  "Creativo/a",
  "Madrugador/a",
  "Nocturno/a",
] as const;

export type ProfileLifestyleTag = (typeof PROFILE_LIFESTYLE_TAGS)[number];

const LEGACY_TAG_LABELS: Record<string, ProfileLifestyleTag> = {
  "Early bird": "Madrugador/a",
};

/** Etiqueta legible para UI (normaliza valores antiguos en BD). */
export function lifestyleTagLabel(tag: string): string {
  return LEGACY_TAG_LABELS[tag] ?? tag;
}

export function normalizeLifestyleTags(tags: string[]): string[] {
  return tags.map((t) => lifestyleTagLabel(t));
}
