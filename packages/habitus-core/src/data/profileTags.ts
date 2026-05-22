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
  "Early bird",
  "Nocturno/a",
] as const;

export type ProfileLifestyleTag = (typeof PROFILE_LIFESTYLE_TAGS)[number];
