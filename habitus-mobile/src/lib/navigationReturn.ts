/** Slug de listing desde ruta web guardada (`/property/mi-casa`). */
export function propertySlugFromReturnPath(path: string | null | undefined): string | null {
  if (!path?.startsWith("/property/")) return null;
  const slug = path.slice("/property/".length).split("?")[0]?.trim();
  return slug || null;
}
