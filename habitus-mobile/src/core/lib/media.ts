/** Placeholder local (sin petición de red) para imágenes ausentes. */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#e8ecef" width="800" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="system-ui,sans-serif" font-size="24">Sin imagen</text></svg>`,
  );

export function normalizeImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

export function imageUrlOrPlaceholder(url: string | null | undefined): string {
  return normalizeImageUrl(url) ?? PLACEHOLDER_IMAGE;
}
