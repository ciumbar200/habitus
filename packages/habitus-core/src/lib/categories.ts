import type { Category } from "../types/models";

/** Categoría sintética «Todos»; excluye duplicados con slug `all` en BD. */
export const ALL_CATEGORY_SLUG = "__all__";

/** Filtros de Descubrir: habitación suelta vs piso entero. */
export const DISCOVER_CATEGORY_SLUGS = ["habitacion", "piso-grupo"] as const;

export function buildCategoryFilters(
  categories: Category[],
  allLabel: string,
  allowedSlugs: readonly string[] = DISCOVER_CATEGORY_SLUGS,
): Category[] {
  const fromDb = categories
    .filter((c) => c.slug !== "all" && allowedSlugs.includes(c.slug))
    .sort(
      (a, b) =>
        allowedSlugs.indexOf(a.slug) - allowedSlugs.indexOf(b.slug),
    );
  return [{ id: ALL_CATEGORY_SLUG, slug: "all", label: allLabel }, ...fromDb];
}
